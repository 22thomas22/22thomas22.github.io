function collectUnits(node, breadcrumb = [], results = []) {
    if (node === null || typeof node !== "object") {
        return results; // nothing to collect from a plain value
    }

    const isUnit = Object.hasOwn(node, "FLAGS") && node.FLAGS.includes("UNIT");

    if (isUnit) {
        // keep this unit's own fields together as ONE entry, tagged with its path
        results.push({ ...node, breadcrumb: [...breadcrumb] });
    }

    for (const key of Object.keys(node)) {
        const breadcrumbTemp = [...breadcrumb];
        breadcrumbTemp.push(node.ALIAS ?? key);
        collectUnits(node[key], breadcrumbTemp, results);
    }

    return results;
}

export { collectUnits };