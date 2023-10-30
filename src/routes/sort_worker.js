onmessage = (data) => {
    const pixelAarray = data.data[0];
    let origData = data.data[1];
    for (let i = 1; i < pixelAarray.length - 1; i++) {
        let span = [];
        let start;
        for (let j = 1; j < pixelAarray[i].length - 1; j++) {
            if (pixelAarray[i][j][0] == 255) {
                if (!start) {
                    start = j;
                }
                span.push(origData[i][j]);
                continue;
            }
            if (span.length > 0) {
                const sortedSpan = span.sort(function (a, b) {
                    return a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]);
                });
                Array.prototype.splice.apply(origData[i], [start, sortedSpan.length].concat(sortedSpan));
                span = [];
                start = undefined;
            }
        }
    }
    postMessage(origData)
}