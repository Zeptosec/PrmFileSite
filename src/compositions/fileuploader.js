export const uploadFile = async (file, url) => {
    if (file == null) return;
    var data = new FormData();
    data.append('file', file);
    const res = await fetch(url, {
        method: 'POST',
        body: data
    })
    const json = await res.json();
    if (res.ok) {
        return { name: file.name, location: json.location };
    } else {
        throw Error(json.error);
    }
}

export const uploadFiles = async (files, url) => {
    if (files == null) return;
    let locs = [];
    await Promise.all(
        files.map(
            async file => {
                locs.push(await uploadFile(file.file, url))
            }
        )
    );
    return locs;
}
