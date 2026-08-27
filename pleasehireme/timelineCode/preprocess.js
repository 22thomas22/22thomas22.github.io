// ============================================================
// FORMAT PARSING HELPERS
// ============================================================

// "key", "key:TYPE", "#key<-FLAG:TYPE" -> { name, type, flags, sigil }
function parseKeyDescriptor(raw) {
    let str = raw;
    let flags = [];

    if (str.includes("<-")) {
        const pieces = str.split("<-");
        str = pieces[0];
        flags = pieces.slice(1);
    }

    let type = null;
    if (str.includes(":")) {
        const i = str.indexOf(":");
        type = str.slice(i + 1);
        str = str.slice(0, i);
    }

    let sigil = null;
    if ("#$?!".includes(str[0])) {
        sigil = str[0];
        str = str.slice(1);
    }

    return { name: str.trim(), type, flags, sigil };
}

// "$(start:START, end:END)" -> [{name:"start",type:"START"}, {name:"end",type:"END"}]
function parseComposite(rawKey) {
    const inner = rawKey.slice(rawKey.indexOf("(") + 1, rawKey.lastIndexOf(")"));
    return inner.split(",").map(part => {
        const [name, type] = part.split(":").map(s => s.trim());
        return { name, type: type || "STRING" };
    });
}

// splits an actual data key like "8/21/24,1/13/25" using a composite's field list
function splitCompositeValue(rawKey, fields) {
    const values = rawKey.split(",").map(s => s.trim());
    const out = {};
    fields.forEach((f, i) => { out[f.name] = values[i]; });
    return out;
}

// Turns array-shorthand format ("name", "name:TYPE", {key:[...]}) into a plain object.
// Bare UPPERCASE words (e.g. "DESCRIPTION") type themselves, per your reserved-word convention.
function normalizeFormat(format) {
    if (format == null) return {};
    if (!Array.isArray(format)) return format;

    const obj = {};
    for (const item of format) {
        if (typeof item === "string") {
            if ("#$?!".includes(item[0])) {
                obj[item] = null;
            } else if (item.includes(":")) {
                const [name, type] = item.split(":");
                obj[name] = type;
            } else if (item === item.toUpperCase()) {
                obj[item] = item;
            } else {
                obj[item] = "STRING";
            }
        } else if (item && typeof item === "object") {
            Object.assign(obj, item);
        }
    }
    return obj;
}

// Splits a normalized format object's keys by role: fixed / wildcard(#) / composite($) / exception(!) / choice(?)
function classifyFormatKeys(format) {
    const result = { fixed: [], wildcardRaw: null, compositeRaw: null, exceptions: [], choices: [] };
    for (const key of Object.keys(format)) {
        const sigil = "#$?!".includes(key[0]) ? key[0] : null;
        if (sigil === "#") result.wildcardRaw = key;
        else if (sigil === "$") result.compositeRaw = key;
        else if (sigil === "?") result.choices.push(key);
        else if (sigil === "!") result.exceptions.push(key);
        else result.fixed.push(key);
    }
    return result;
}

// ============================================================
// MAIN WALKER
// ============================================================

function preprocess(data, format = {}) {
    // base case — primitives pass straight through
    if (data === null || typeof data !== "object") {
        return data;
    }

    // pick up this scope's own FORMAT, if it declares one
    if (!Array.isArray(data) && Object.hasOwn(data, "METADATA")) {
        console.assert(Object.hasOwn(data.METADATA, "FORMAT"),
            "METADATA missing FORMAT:", data);
        format = data.METADATA.FORMAT;
    }

    format = normalizeFormat(format);

    // ---- ARRAY: one format describes every element ----
    if (Array.isArray(data)) {
        // a format like {"#class<-UNIT": [...]} wrapping an array means
        // "each element IS one of these," not "look for a key called #class"
        let elementFormat = format;
        let elementAlias = null, elementFlags = [];

        const keys = Object.keys(format);
        if (keys.length === 1 && keys[0][0] === "#") {
            const info = parseKeyDescriptor(keys[0]);
            elementFormat = format[keys[0]];
            elementAlias = info.name;
            elementFlags = info.flags;
        }

        return data.map(item => {
            const processed = preprocess(item, elementFormat);
            if (processed && typeof processed === "object" && !Array.isArray(processed)) {
                if (elementAlias) processed.ALIAS = elementAlias;
                if (elementFlags.length) processed.FLAGS = elementFlags;
            }
            return processed;
        });
    }

    // ---- OBJECT ----
    const out = {};

    // expose color info for filter-button styling, if this scope has any
    if (data.METADATA && data.METADATA.color) {
        out.META = data.METADATA.color;
    }

    // resolve ?shape choices: whichever declared field set is fully present
    // in the real data "wins" and gets merged in as if declared directly here
    let { fixed, wildcardRaw, compositeRaw, exceptions, choices } = classifyFormatKeys(format);
    const effectiveFormat = { ...format };
    for (const choiceKey of choices) {
        const choiceFormat = normalizeFormat(format[choiceKey]);
        const fieldNames = Object.keys(choiceFormat);
        if (fieldNames.length && fieldNames.every(f => Object.hasOwn(data, f))) {
            Object.assign(effectiveFormat, choiceFormat);
            break; // first matching shape wins
        }
    }
    ({ fixed, wildcardRaw, compositeRaw, exceptions } = classifyFormatKeys(effectiveFormat));

    const wildcardInfo = wildcardRaw ? parseKeyDescriptor(wildcardRaw) : null;
    const compositeFields = compositeRaw ? parseComposite(compositeRaw) : null;
    const exceptionList = exceptions.map(raw => ({ raw, info: parseKeyDescriptor(raw) }));

    for (const key of Object.keys(data)) {
        if (key === "METADATA") continue;

        let childFormat;
        let newKey = key;
        let alias = null;
        let flags = [];
        let composedFields = null;

        const exceptionMatch = exceptionList.find(e => e.info.name === key);

        if (fixed.includes(key)) {
            childFormat = effectiveFormat[key];
            if (typeof childFormat === "string") {
                if (childFormat !== key) newKey = key + ":" + childFormat;
                childFormat = undefined;
            }
        } else if (exceptionMatch) {
            childFormat = effectiveFormat[exceptionMatch.raw];
            flags = exceptionMatch.info.flags;
            if (exceptionMatch.info.type) newKey = key + ":" + exceptionMatch.info.type;
        } else if (compositeRaw) {
            childFormat = effectiveFormat[compositeRaw];
            composedFields = splitCompositeValue(key, compositeFields);
            flags = parseKeyDescriptor(compositeRaw).flags;
        } else if (wildcardRaw) {
            childFormat = effectiveFormat[wildcardRaw];
            alias = wildcardInfo.name;
            flags = wildcardInfo.flags;
            if (wildcardInfo.type) newKey = key + ":" + wildcardInfo.type;
        } else {
            childFormat = undefined; // no rule matched — leave as-is, don't guess
        }

        const value = preprocess(data[key], childFormat);

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            if (alias) value.ALIAS = alias;
            if (flags.length) value.FLAGS = flags;
            if (composedFields) Object.assign(value, composedFields);
        }

        out[newKey] = value;
    }

    return out;
}

export { preprocess };