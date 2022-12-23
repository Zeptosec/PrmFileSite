import { ref } from 'vue';
import axios from 'axios'
import { supabase } from '../supabase';
import { getIdFromLink } from './filedownloader.js';

export const chunkSize = 8 * 1024 * 1024;

const saveFileToDB = async (name, locations, userid, size) => {
    let obj;
    if (size > chunkSize) {
        obj = { name, chunks: getIdFromLink(locations), userid, size };
    } else {
        obj = { name, chunks: getIdFromLink(locations), userid, size, fileid: null };
    }
    const { error, data } = await supabase
        .from('Files')
        .insert(obj);
    if (error) {
        throw Error(error);
    }
    return data[0];
}

const finishUpFile = async (status, theUser) => {
    let dbData;
    if (theUser) {
        dbData = await saveFileToDB(status.value.name, status.value.location, theUser.id, status.value.size);
        if (dbData.chunks.length == 1) {
            dbData.link = status.value.location[0];
        } else {
            dbData.link = "/file/" + dbData.fileid;
        }
    } else {
        dbData = { link: status.value.location[0], name: status.value.name, size: status.value.size, fileid: null };
    }
    // console.log(dbData);
    // console.log(status.value)

    status.value.savedFileData = dbData;
    status.value.finished = true;
}

/**
 * 
 * @param {File} chunk uploads a single chunk to server.
 * @param {string} url api end point to upload to.
 * @param {Object} status ref to status for storing information about upload
 * @param {Number} index where in array to store this blob for reconstruction purposes
 */
const uploadChunkWithStatus = async (chunk, url, status, index, place, theUser) => {
    if (chunk.size > chunkSize)
        throw Error("Chunk size is too big");

    var data = new FormData();
    data.append('file', chunk);
    let prevLoaded = 0;
    let json = null;
    while (!json) {
        try {
            const res = await axios.post(url, data, {
                onUploadProgress: function (event) {
                    // for small files on fast internet otherwise overshoots
                    let loaded = Math.min(event.loaded, chunk.size);
                    status.value.uploadedBytes += loaded - prevLoaded;
                    prevLoaded = loaded;
                }
            });
            // console.log(`chunk was uploaded`)
            // console.log(`${status.value.name} - ${index} - ${Math.round(status.value.uploadedBytes / status.value.size * 10000) / 100}`);
            // console.log(`${status.value.uploadedBytes} / ${status.value.size}`);
            // console.log(`${status.value.locationsObtained} / ${status.value.locationLengthUploaded}`);
            json = res.data;
        } catch (err) {
            console.log("Failed to upload chunk retrying...");
            console.log(err);
            await new Promise(r => setTimeout(r, 3000));
            //throw Error(err.response.data.error)
        }
    }
    status.value.location[index] = json.location;
    status.value.locationsObtained += 1;
    if (status.value.locationsObtained == status.value.locationLengthUploaded) {
        // console.log(`${status.value.name} Writing file to database`);
        await finishUpFile(status, theUser);
    }
    return place;
}

let promises = [];
let pendingReserve = false;
const limit = 15;

/**
 * 
 * @param {string} url URL to api end point with reserving logic 
 * @returns Object with index of completed promise can be null if didint check, and success for reserving spot on server
 */
const getReserve = async (url) => {
    let completed = null;
    // if (pendingReserve) {
    //     return { completed, success: false };
    // }
    // pendingReserve = true;
    //console.log(`promises.length >= limit: ${promises.length} >= ${limit}`)
    if (promises.length >= limit) {
        //console.log(`Promise array is full waiting for one to finish`);
        completed = await Promise.any(promises);
        //console.log(`Promise number ${completed} finished`);
    }
    // let res;
    // try {
    //     //console.log(`trying to reserve`);
    //     res = await axios.get(url);
    // } catch (err) {
        //console.log(`Got an error while reserving if its 451 then just wait..`);
    //     console.log(err);
    //     setTimeout(() => pendingReserve = false, 1000);
    //     return { completed, success: false };
    // }
    // if (res.status != 202) {
    //     console.log(`Could not reserve..`);
    //     setTimeout(() => pendingReserve = false, 1000);
    //     return { completed, success: false };
    // }
    // pendingReserve = false;
    return { completed, success: true };
}

const uploadChunkedWithStatus3 = async (file, url, status, theUser) => {
    let cnt = 1;
    let start = 0;
    let end = 0;
    const resUrl = `${url.slice(0, url.lastIndexOf("/"))}/reserve`;
    while (end < file.size) {
        // get reserve
        const { completed, success } = await getReserve(resUrl);
        if (!success) {
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }
        // console.log(`Passed reserve means got reserve`);
        end = Math.min(chunkSize * cnt, file.size)
        let chunk;
        if (start == 0 && end == file.size) {
            chunk = file;
        } else {
            chunk = file.slice(start, end);
        }
        if (completed != null) {
            // console.log(`Replacing completed chunk ${completed} slot with new`);
            promises[completed] = uploadChunkWithStatus(chunk, url, status, cnt - 1, completed, theUser);
        } else if (promises.length < limit) {
            // console.log(`Pushing new chunk on list`);
            const pushInd = promises.length;
            promises.push(uploadChunkWithStatus(chunk, url, status, cnt - 1, pushInd, theUser));
        } else {
            throw Error("Somehow completed promises got lost???");
        }
        // console.log(`Amount of promises in list: ${promises.length}`);
        start = end;
        cnt++;
    }
}

export const uploadFileWithStatus2 = async (file, url, theUser, status) => {
    if (!file) return;

    if (file.size > chunkSize) {
        if (!theUser) {
            throw Error("File is too large. To upload file larger than 8 MB please login.");
        }
        await uploadChunkedWithStatus3(file, url, status, theUser);

        //throw Error("This is tmp error will be removed");
    } else {
        await uploadChunkedWithStatus3(file, url, status, theUser);
    }
}

const RetryFunction = async (status) => {

}

export const uploadFilesWithStatus2 = async (files, url, theUser, status) => {
    if (files == null) return;
    // when im not lazy would be a good idea to add typescript
    status.value.finished = false;
    for (let i = 0; i < files.length; i++) {
        const fstatus = ref({
            name: files[i].file.name,
            size: files[i].file.size,
            uploadedBytes: 0,
            location: [],
            finished: false,
            locationsObtained: 0,
            locationLengthUploaded: Math.ceil(files[i].file.size / chunkSize),
            savedFileData: null
        });
        status.value.files.push(fstatus);
    }

    for (let i = 0; i < files.length; i++) {
        try {
            await uploadFileWithStatus2(files[i].file, url, theUser, status.value.files[i]);
        } catch (err) {
            status.value.files[i].value.error = err.message;
            status.value.files[i].value.retryFunction = RetryFunction;
            status.value.hasErrors = true;
        }
    }
    await Promise.all(promises);
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

    // for (let i = 0; i < files.length; i++) {
    //     const fstatus = ref();
    //     status.value.files.push(fstatus);
    //     try {
    //         await uploadFileWithStatus(files[i].file, url, isLoggedIn, fstatus);
    //     } catch (err) {
    //         fstatus.value.error = err.message;
    //         status.value.hasErrors = true;
    //     }
    // }


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