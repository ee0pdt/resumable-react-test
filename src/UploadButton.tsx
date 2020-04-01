import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ReactResumableJs from "react-resumable-js";

const useStyles = makeStyles(theme => ({
  root: {
    "& > *": {
      margin: theme.spacing(1)
    }
  },
  input: {
    display: "none"
  }
}));

export default function UploadButton() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {/* <input
        accept="image/*"
        className={classes.input}
        id="contained-button-file"
        multiple
        type="file"
        onClick={event => resumeable.upload()}
      />
      <label htmlFor="contained-button-file">
        <Button variant="contained" color="primary" component="span">
          Upload
        </Button>
      </label> */}

      <ReactResumableJs
        uploaderID="image-upload"
        dropTargetID="myDropTarget"
        filetypes={["jpg", "png"]}
        fileAccept="image/*"
        fileAddedMessage="Started!"
        completedMessage="Complete!"
        service="http://localhost:3000/upload"
        textLabel="Uploaded files"
        previousText="Drop to upload your media:"
        disableDragAndDrop={true}
        onFileSuccess={(file, message) => {
          console.log(file, message);
        }}
        onFileAdded={(file, resumable) => {
          resumable.upload();
        }}
        maxFiles={1}
        startButton={true}
        pauseButton={false}
        cancelButton={false}
        onStartUpload={() => {
          console.log("Start upload");
        }}
        onCancelUpload={() => {
          this.inputDisable = false;
        }}
        onPauseUpload={() => {
          this.inputDisable = false;
        }}
        onResumeUpload={() => {
          this.inputDisable = true;
        }}
      />
    </div>
  );
}
