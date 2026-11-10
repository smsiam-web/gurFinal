import React, { Fragment, useState, useEffect } from "react";
import Button from "./Button";
import { MdDone, MdPublishedWithChanges } from "react-icons/md";
import { db, storage } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import { updateTempImgUrl } from "@/app/redux/slices/tempImgUrl";

const FileUpload = (props) => {
  const dispatch = useDispatch();

  useEffect(() => {
    clearFileUpload();
  }, []);

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileSizeKB, setFileSizeKB] = useState("");
  const [fileType, setFileType] = useState("");
  const [src, setSrc] = useState("");

  const clearFileUpload = () => {
    setFileName("");
    setFileSize("");
    setFileType("");
    setSrc("");
    props.dataChanger("");
  };

  const onPickFile = (e) => {
    e.preventDefault();
    clearFileUpload();
    document.getElementById(props?.name).click();
  };

  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  //upload on firebase storage
  const upload = (file) => {
    setProgress(0);
    setUrl(null);
    setError(null);
    setLoading(true);
    if (!file) return setError("Choose an image");
    const storageRef = storage.ref(`${props?.path}/${props.uid}`);
    const uploadTask = storageRef.put(file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progress);
      },
      (error) => {
        setLoading(false);
        setError(error.message);
      },
      // get image url from firebase
      async () => {
        const url = await storageRef.getDownloadURL();
        setUrl(url);
        // update redux with image url 
        await dispatch(updateTempImgUrl(url));
        setLoading(false);
      }
    );
  };

  const onFilePicked = (e) => {
    let files = e.target.files;

    upload(files[0]);

    let file_name = files[0]?.name;
    let file_size = getFileSize(files[0]?.size);
    let file_size_kb = getFileSizeKB(files[0]?.size);
    let file_type = getFileType(files[0])?.toLowerCase();

    setFileName(file_name);
    setFileSize(file_size);
    setFileSizeKB(file_size_kb);
    setFileType(file_type);

    if (
      props?.allowed_extensions &&
      !arrToLowerCase(props?.allowed_extensions).includes(file_type)
    ) {
      clearFileUpload();
      alert("Allowed file type = " + props?.allowed_extensions);
      return false;
    }

    let fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      // console.log(fileReader.result);
      props.dataChanger(fileReader.result);
      setSrc(fileReader.result);
    });
    fileReader.readAsDataURL(files[0]);
  };

  const getFileSize = (file_size) => {
    if (file_size / 1024 >= 1024) {
      file_size = parseInt(file_size / 1024 / 1024) + " MB";
    } else {
      file_size = parseInt(file_size / 1024) + " KB";
    }
    return file_size;
  };

  const getFileSizeKB = (file_size) => {
    file_size = parseInt(file_size / 1024);
    return file_size;
  };

  const getFileType = (file) => {
    return file?.type.split("/").pop();
  };

  const arrToLowerCase = (arr = []) => {
    return arr.map((str) => str.toLowerCase());
  };

  return (
    <Fragment>
      <div onClick={(e) => onPickFile(e)} className="mt-1 flex items-center">
        <div className="w-full text-center">
          <div
            className="px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer"
            role="button"
            tabIndex="0"
          >
            {props?.type == "image" && src && props?.prev_src ? (
              <div className="flex items-center flex-col gap-3">
                <img
                  src={url}
                  alt=""
                  className="mt-2 text-center h-auto max-w-[260px]"
                />
                {fileName && <label>{fileName}</label>}
                {fileSize && (
                  <>
                    <label className="label label-info">
                      File Size:({fileSize})
                    </label>
                    <label className="label label-info flex items-center gap-2">
                      Uploaded: <span>{progress}%</span>{" "}
                      {progress === 100 && (
                        <span className="text-green-600 bg-green-200 p-1 rounded-full">
                          <MdDone size={14} />
                        </span>
                      )}
                    </label>
                  </>
                )}
                <Button
                  className="bg-primary text-white"
                  onClick={clearFileUpload}
                  title="Change"
                  icon={<MdPublishedWithChanges size={22} />}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div>
                <span className="mx-auto flex justify-center">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-3xl text-primary"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polyline points="16 16 12 12 8 16"></polyline>
                    <line x1="12" y1="12" x2="12" y2="21"></line>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                    <polyline points="16 16 12 12 8 16"></polyline>
                  </svg>
                </span>
                <p className="text-sm mt-2">Select / Drag your image here</p>
                <em className="text-xs text-gray-400">
                  (Only *.jpeg, jpg, gif and *.png images will be accepted)
                </em>
                <h6 className="text-xs text-gray-400">{props.recommended}</h6>
              </div>
            )}
          </div>
          <aside className="flex flex-row flex-wrap mt-4"></aside>
        </div>
      </div>

      <input
        className="file d-none hidden"
        type="file"
        data-show-upload="true"
        data-show-caption="true"
        id={props?.name}
        name={props?.name}
        required={props?.required ? true : false}
        onChange={(e) => onFilePicked(e)}
      />
    </Fragment>
  );
};

export default FileUpload;
