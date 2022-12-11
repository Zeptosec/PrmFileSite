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
    let json = null;
    while (!json) {
        try {
            res = await axios.post(url, data, {
                onUploadProgress: function (event) {
                    // for small files on fast internet otherwise overshoots
                    let loaded = Math.min(event.loaded, chunk.size);
                    status.value.uploadedBytes += loaded - prevLoaded;
                    prevLoaded = loaded;
                }
            });
            json = res.data;
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
    
    status.value.location[index] = json.location;
    return place;
}

let promises = [];
let pendingReserve = false;

/**
 * 
 * @param {string} url URL to api end point with reserving logic 
 * @returns Object with index of completed promise can be null if didint check, and success for reserving spot on server
 */
const getReserve = async (url) => {
    let completed = null;
    if(pendingReserve){
        return { completed, success: false };
    }
    pendingReserve = true;
    if (promises.length >= 15) {
        completed = await Promise.any(promises);
    }
    let res;
    try {
        res = await axios.get(url);
    } catch (err) {
        console.log(err);
        setTimeout(() => pendingReserve = false, 1000);
        return { completed, success: false };
    }
    if (res.status != 202) {
        setTimeout(() => pendingReserve = false, 1000);
        return { completed, success: false };
    }
    pendingReserve = false;
    return { completed, success: true };
}

/**
 * Uploads file by cutting it to chunks and saving to server
 * @param {File} file File that will be split into largest chunks and uploaded.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 */
const uploadChunkedWithStatus2 = async (file, url, status) => {
    let cnt = 1;
    let start = 0;
    let end = 0;
    const resUrl = `${url.slice(0, url.lastIndexOf("/"))}/reserve`;
    while (end < file.size) {
        // get reserve
        const { completed, success } = await getReserve(resUrl);
        if (!success) {
            await new Promise(r => setTimeout(r, 500));
            continue;
        }
        //console.log(promises.length);
        // logic for uploading
        end = Math.min(chunkSize * cnt, file.size)
        const chunk = file.slice(start, end);
        //console.log(`${file.name} got reserve ${start} - ${end} | comp: ${completed}`);
        if(completed != null){
            promises[completed] = uploadChunkWithStatus(chunk, url, status, cnt - 1, completed);
        } else if (promises.length < 15) {
            const pushInd = promises.length;
            promises.push(uploadChunkWithStatus(chunk, url, status, cnt - 1, pushInd));
        } else {
            throw Error("Somehow completed promises got lost???");
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

    status.value = {
        name: file.name,
        size: file.size,
        uploadedBytes: 0,
        location: [],
        finished: false,
    }

    if (file.size > chunkSize) {
        if (!isLoggedIn) {
            throw Error("File is too large. To upload file larger than 8 MB please login.");
        }
        await uploadChunkedWithStatus2(file, url, status);
        //throw Error("This is tmp error will be removed");
    } else {
        await uploadChunkedWithStatus2(file, url, status);
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

    await Promise.all(
        files.map(async file => {
            const fstatus = ref();
            status.value.files.push(fstatus);
            try {
                await uploadFileWithStatus(file.file, url, isLoggedIn, fstatus)
            } catch (err) {
                fstatus.value.error = err.message;
                status.value.hasErrors = true;
            }
        })
    )
    status.value.finished = true;
}