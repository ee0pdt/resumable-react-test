import React, { useState, useEffect } from "react";
import Resumablejs from "resumablejs";

import IUploaderProps from "./IUploaderProps";

interface IFileList {
  files: Resumable.ResumableFile[];
}

interface ILocalState {
  fileList: IFileList;
  progressBar: number;
  messageStatus: string;
  isPaused: boolean;
  isUploading: boolean;
  resumable?: Resumable.Resumable;
}

const MAX_FILE_SIZE = 10240000;
const CHUNK_SIZE = 1024 * 1024;

const defaultProps = {
  maxFiles: undefined,
  uploaderID: "default-resumable-uploader",
  dropTargetID: "drop-target",
  filetypes: [],
  fileAccept: "*",
  maxFileSize: MAX_FILE_SIZE,
  showFileList: true,
  onUploadErrorCallback: (file: Resumable.ResumableFile, message: string) => {
    console.log("error", file, message);
  },
  onFileRemoved: function(file: Resumable.ResumableFile) {
    return file;
  },
  onCancelUpload: function() {
    return true;
  },
  onPauseUpload: function() {
    return true;
  },
  onResumeUpload: function() {
    return true;
  },
  onStartUpload: function() {
    return true;
  },
  disableDragAndDrop: false,
  fileNameServer: "",
  tmpDir: "",
  chunkSize: CHUNK_SIZE,
  simultaneousUploads: 1,
  fileParameterName: "file",
  maxFilesErrorCallback: null,
  cancelButton: false,
  pause: false,
  startButton: null,
  pauseButton: null,
  previousText: "",
  headerObject: {},
  withCredentials: false,
  forceChunkSize: false
};

export const Uploader = (props: IUploaderProps) => {
  const [localState, setLocalState] = useState<ILocalState>({
    progressBar: 0,
    messageStatus: "",
    fileList: { files: [] },
    isPaused: false,
    isUploading: false,
    resumable: undefined
  });

  let dropZone: null | HTMLElement = null;
  let uploader: null | HTMLElement = null;

  const mergedProps = {
    ...defaultProps,
    ...props
  };

  useEffect(() => {
    const config: Resumable.ConfigurationHash = {
      target: mergedProps.service,
      query: mergedProps.query || {},
      fileType: mergedProps.filetypes,
      maxFiles: mergedProps.maxFiles,
      maxFileSize: (mergedProps.maxFileSize as unknown) as boolean, // yay for hacks!
      fileTypeErrorCallback: (file: Resumable.ResumableFile, errorCount) => {
        if (typeof mergedProps.onFileAddedError === "function") {
          mergedProps.onFileAddedError(file, errorCount);
        }
      },
      maxFileSizeErrorCallback: (file: Resumable.ResumableFile, errorCount) => {
        if (typeof mergedProps.onMaxFileSizeErrorCallback === "function") {
          mergedProps.onMaxFileSizeErrorCallback(file, errorCount);
        }
      },
      testMethod: mergedProps.testMethod || "POST",
      testChunks: mergedProps.testChunks || false,
      headers: mergedProps.headerObject || {},
      withCredentials: mergedProps.withCredentials || false,
      chunkSize: mergedProps.chunkSize,
      simultaneousUploads: mergedProps.simultaneousUploads,
      fileParameterName: mergedProps.fileParameterName,
      generateUniqueIdentifier: mergedProps.generateUniqueIdentifier,
      forceChunkSize: mergedProps.forceChunkSize
    };

    const resumable = new Resumablejs(config);

    if (typeof mergedProps.maxFilesErrorCallback === "function") {
      resumable.opts.maxFilesErrorCallback = mergedProps.maxFilesErrorCallback;
    }

    // resumable.assignBrowse(uploader, false);

    //Enable or Disable DragAnd Drop
    if (mergedProps.disableDragAndDrop === false) {
      resumable.assignDrop(dropZone);
    }

    resumable.on("fileAdded", (file: Resumable.ResumableFile, event: Event) => {
      setLocalState({
        ...localState,
        messageStatus: mergedProps.fileAddedMessage || " Starting upload! "
      });

      if (typeof mergedProps.onFileAdded === "function") {
        mergedProps.onFileAdded(file, resumable);
      } else {
        resumable.upload();
      }
    });

    resumable.on(
      "fileSuccess",
      (file: Resumable.ResumableFile, fileServer: any) => {
        if (mergedProps.fileNameServer) {
          let objectServer = JSON.parse(fileServer);
          file.fileName = objectServer[mergedProps.fileNameServer];
        } else {
          file.fileName = fileServer;
        }

        let currentFiles = localState.fileList.files;
        currentFiles.push(file);

        setLocalState({
          ...localState,
          fileList: { files: currentFiles },
          messageStatus:
            mergedProps.completedMessage + file.fileName || fileServer
        });

        if (typeof mergedProps.onFileSuccess === "function") {
          mergedProps.onFileSuccess(file, fileServer);
        }
      }
    );

    resumable.on("progress", () => {
      setLocalState({
        ...localState,
        isUploading: resumable.isUploading()
      });

      const progress = resumable.progress() * 100;

      if (progress < 100) {
        setLocalState({
          ...localState,
          messageStatus: progress + "%",
          progressBar: progress
        });
      } else {
        setTimeout(() => {
          setLocalState({
            ...localState,
            progressBar: 0
          });
        }, 1000);
      }
    });

    resumable.on(
      "fileError",
      (file: Resumable.ResumableFile, message: string) => {
        mergedProps.onUploadErrorCallback(file, message);
      }
    );

    setLocalState({
      ...localState,
      resumable
    });
  }, [props]);

  // const removeFile = (
  //   event: Event,
  //   file: Resumable.ResumableFile,
  //   index: number
  // ) => {
  //   event.preventDefault();

  //   let currentFileList = localState.fileList.files;
  //   delete currentFileList[index];

  //   setLocalState({
  //     ...localState,
  //     fileList: { files: currentFileList }
  //   });

  //   mergedProps.onFileRemoved(file);
  //   localState.resumable!.removeFile(file);
  // };

  // const createFileList = () => {

  //     let markup = localState.fileList.files.map((file: Resumable.ResumableFile, index) => {

  //         let uniqID = mergedProps.uploaderID + '-' + index;
  //         let originFile = file.file;
  //         let media = null;

  //         if (file.file.type.indexOf('video') > -1) {
  //             media = (<label className="video">{originFile.name}</label>);
  //             return (<li className="thumbnail" key={uniqID}>
  //                 <label id={"media_" + uniqID}>{media}</label>
  //                 <a onClick={(event) => this.removeFile(event, file: Resumable.ResumableFile, index)} href="#">[X]</a>
  //             </li>);
  //         }
  //         else if (file.file.type.indexOf('image') > -1) if (mergedProps.tmpDir !== "") {
  //             let src = mergedProps.tmpDir + file.fileName;
  //             media = (<img className="image" width="80" src={src} alt=""/>);
  //             return (<li className="thumbnail" key={uniqID}>
  //                 <label id={"media_" + uniqID}>{media}</label>
  //                 <a onClick={(event) => this.removeFile(event, file: Resumable.ResumableFile, index)} href="#">[X]</a>
  //             </li>);

  //         } else {
  //             let fileReader = new FileReader();
  //             fileReader.readAsDataURL(originFile);
  //             fileReader.onload = (event) => {
  //                 media = '<img class="image" width="80" src="' + event.target.result + '"/>';
  //                 document.querySelector("#media_" + uniqID).innerHTML = media;
  //             };
  //             return <li className="thumbnail" key={uniqID}>
  //                 <label id={"media_" + uniqID}/>
  //                 <a onClick={(event) => this.removeFile(event, file: Resumable.ResumableFile, index)} href="#">[X]</a>
  //             </li>;
  //         } else {
  //             media = (<label className="document">{originFile.name}</label>);
  //             return (<li className="thumbnail" key={uniqID}>
  //                 <label id={"media_" + uniqID}>{media}</label>
  //                 <a onClick={(event) => this.removeFile(event, file: Resumable.ResumableFile, index)} href="#">[X]</a>
  //             </li>);
  //         }
  //     });

  //     return (<ul id={"items-" + mergedProps.uploaderID}>{markup}</ul>);
  // };

  const createFileList = () => null;

  const cancelUpload = () => {
    localState.resumable!.cancel();

    setLocalState({
      ...localState,
      fileList: { files: [] }
    });

    mergedProps.onCancelUpload();
  };

  const pauseUpload = () => {
    if (!localState.isPaused) {
      localState.resumable!.pause();
      setLocalState({
        ...localState,
        isPaused: true
      });
      mergedProps.onPauseUpload();
    } else {
      localState.resumable!.upload();
      setLocalState({
        ...localState,
        isPaused: false
      });
      mergedProps.onResumeUpload();
    }
  };

  const startUpload = () => {
    localState.resumable!.upload();
    setLocalState({
      ...localState,
      isPaused: false
    });
    mergedProps.onStartUpload();
  };

  const fileList = mergedProps.showFileList ? (
    <div className="resumable-list">{createFileList()}</div>
  ) : null;

  let previousText = null;

  if (mergedProps.previousText) {
    if (typeof mergedProps.previousText === "string") {
      previousText = <p>{mergedProps.previousText}</p>;
    } else {
      previousText = mergedProps.previousText;
    }
  }

  const textLabel = mergedProps.textLabel ? mergedProps.textLabel : null;

  let startButton = null;

  if (mergedProps.startButton) {
    if (
      typeof mergedProps.startButton === "string" ||
      typeof mergedProps.startButton === "boolean"
    ) {
      startButton = (
        <label>
          <button
            disabled={localState.isUploading}
            className="btn start"
            onClick={startUpload}
          >
            {mergedProps.startButton && "upload"}
          </button>
        </label>
      );
    } else {
      startButton = mergedProps.startButton;
    }
  }

  let cancelButton = null;

  if (mergedProps.cancelButton) {
    if (
      typeof mergedProps.cancelButton === "string" ||
      typeof mergedProps.cancelButton === "boolean"
    ) {
      cancelButton = (
        <label>
          <button
            disabled={!localState.isUploading}
            className="btn cancel"
            onClick={cancelUpload}
          >
            {mergedProps.cancelButton && "cancel"}
          </button>
        </label>
      );
    } else {
      cancelButton = mergedProps.cancelButton;
    }
  }

  let pauseButton = null;
  if (mergedProps.pauseButton) {
    if (
      typeof mergedProps.pauseButton === "string" ||
      typeof mergedProps.pauseButton === "boolean"
    ) {
      pauseButton = (
        <label>
          <button
            disabled={!localState.isUploading}
            className="btn pause"
            onClick={pauseUpload}
          >
            {mergedProps.pauseButton && "pause"}
          </button>
        </label>
      );
    } else {
      pauseButton = mergedProps.pauseButton;
    }
  }

  return (
    <div id={mergedProps.dropTargetID} ref={node => (dropZone = node)}>
      {previousText}
      <label
        className={
          mergedProps.disableInput
            ? "btn file-upload disabled"
            : "btn file-upload"
        }
      >
        {textLabel}
        <input
          ref={node => (uploader = node)}
          type="file"
          id={mergedProps.uploaderID}
          className="btn"
          name={mergedProps.uploaderID + "-upload"}
          accept={mergedProps.fileAccept || "*"}
          disabled={mergedProps.disableInput || false}
        />
      </label>

      <div
        className="progress"
        style={{ display: localState.progressBar === 0 ? "none" : "block" }}
      >
        <div
          className="progress-bar"
          style={{ width: localState.progressBar + "%" }}
        />
      </div>

      {fileList}
      {startButton}
      {pauseButton}
      {cancelButton}
    </div>
  );
};

export default Uploader;
