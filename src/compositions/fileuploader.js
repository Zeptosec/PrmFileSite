import { ref } from 'vue';
import axios from 'axios'

export const chunkSize = 8 * 1024 * 1024;

/**
 * 
 * @param {File} chunk uploads a single chunk to server.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 * @param {Number} index where in array to store this blob for reconstruction purposes
 */
const uploadChunkWithStatus = async (chunk, url, status, index, place) => {
    if (chunk.size > chunkSize)
        throw Error("Chunk size is too big");

    var data = new FormData();
    data.append('file', chunk);
    let prevLoaded = 0;
    let res = null;
    let finished = false;
    while (!finished) {
        try {
            res = await axios.post(url, data, {
                onUploadProgress: function (event) {
                    // for small files on fast internet otherwise overshoots
                    let loaded = Math.min(event.loaded, chunk.size);
                    status.value.uploadedBytes += loaded - prevLoaded;
                    prevLoaded = loaded;
                }
            });
            finished = true;
        } catch (err) {
            console.log("Failed to upload chunk retrying...");
            console.log(err);
            if (err.response.data) {
                console.log(err.response.data);
            }
            await new Promise(r => setTimeout(r, 3000));
            //throw Error(err.response.data.error)
        }
    }
    if (res == null)
        throw Error("Failed to get a response");
    const json = res.data;
    status.value.location[index] = json.location;
    return place;
}

/**
 * 
 * @param {File} file File that will be split into largest chunks and uploaded.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 */
const uploadChunkedWithStatus = async (file, url, status) => {
    let cnt = 1;
    let start = 0;
    let end = 0;
    let pushCnt = 0;
    let promises = [];

    while (end < file.size) {
        end = Math.min(chunkSize * cnt, file.size)
        const chunk = file.slice(start, end);
        let completed = null;
        // this is a promise loop only 10 promises at a time can be active
        // otherwise if the file is too big 
        // without this limitation the server will run out of memory and crash
        if (promises.length >= 10) {
            completed = await Promise.any(promises);
        }
        if (completed != null) {
            promises[completed] = uploadChunkWithStatus(chunk, url, status, cnt - 1, completed);
        } else {
            promises.push(uploadChunkWithStatus(chunk, url, status, cnt - 1, pushCnt));
            pushCnt++;
        }
        start = end;
        cnt++;
    }
    await Promise.all(promises);
}

/**
 * 
 * @param {File} file 
 * @param {string} url api end point for uploading files
 * @param {Object} status a ref to object which can be used for showing progress bar
 */
const uploadFileWithStatus = async (file, url, isLoggedIn, status) => {
    if (!file) return;

    // status.value = {
    //     name: file.name,
    //     size: file.size,
    //     uploadedBytes: 0,
    //     location: [],
    //     finished: false,
    // }

    if (file.size > chunkSize) {
        if (!isLoggedIn) {
            throw Error("File is too large. To upload file larger than 8 MB please login.");
        }
        await uploadChunkedWithStatus(file, url, status);
    } else {
        await uploadChunkWithStatus(file, url, status, 0);
    }
    status.value.finished = true;
}

/**
 * 
 * @param {File[]} files files to upload 
 * @param {string} url api end point for uploading files
 * @param {Object[]} status a ref to object which can be used for showing progress bar for each file
 */
export const uploadFilesWithStatus = async (files, url, isLoggedIn, status) => {
    if (files == null) return;
    // when im not lazy would be a good idea to add typescript
    status.value.finished = false;
    // upload one file at the time because problems happen when there are too many files
    let fstatusArr = [];
    for(let i = 0; i < files.length; i++){
        const fstatus = ref({
            name: files[i].file.name,
            size: files[i].file.size,
            uploadedBytes: 0,
            location: [],
            finished: false,
        });
        status.value.files.push(fstatus);
        fstatusArr.push(fstatus);
    }
    
    for(let i = 0; i < files.length; i++){
        try {
            await uploadFileWithStatus(files[i].file, url, isLoggedIn, fstatusArr[i])
            console.log("file " + files[i].file.name);
        } catch (err) {
            fstatusArr[i].value.error = err.message;
            status.value.hasErrors = true;
        }
    }

    // await Promise.all(
    //     files.map(async file => {
    //         const fstatus = ref();
    //         status.value.files.push(fstatus);
    //         try {
    //             await uploadFileWithStatus(file.file, url, isLoggedIn, fstatus)
    //         } catch (err) {
    //             fstatus.value.error = err.message;
    //             status.value.hasErrors = true;
    //         }
    //     })
    // )
    status.value.finished = true;
}