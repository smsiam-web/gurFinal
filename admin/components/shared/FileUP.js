import React, { useState } from "react";
import { Group, rem, Loader } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { BsFillImageFill } from "react-icons/bs";
import { uuid } from "@/admin/utils/helpers";
import { storage } from "@/app/utils/firebase";
import { MdDone } from "react-icons/md";
import { useDispatch } from "react-redux";
import { updateProductImg } from "@/app/redux/slices/updateProductImg";
import Image from "next/image";

const FileUpload = ({ fileLocation }) => {
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState(null);
  const [File, setFile] = useState(null);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();

  //upload on firebase storage
  const upload = (file) => {
    setProgress(0);
    setUrl(null);
    setError(null);
    setFile(true);

    {
      file &&
        file.map((i) => {
          if (!file) return setError("Choose an image");
          const uid = uuid("xxxxxxxxxxxx");

          const storageRef = storage.ref(`${fileLocation}/${uid}`);
          const uploadTask = storageRef.put(i);

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
              const urls = await storageRef.getDownloadURL();
              console.log(urls);
              dispatch(updateProductImg({ urls: urls }));

              setUrl(urls);
            }
          );
        });
    }
  };

  return (
    <div className="pt-2 pb-5">
      <Dropzone
        onDrop={(files) => upload(files)}
        onReject={(files) => console.log("rejected files", files)}
        maxSize={10 * 1024 ** 2}
        multiple={false}
        // accept={png, jpeg, jpg}
      >
        <Group
          position="center"
          spacing="xl"
          style={{ minHeight: rem(200), pointerEvents: "none" }}
        >
          {/* <Dropzone.Accept>accept</Dropzone.Accept>
          <Dropzone.Reject>Reject</Dropzone.Reject> */}
          <Dropzone.Idle>
            {File ? (
              <div className="flex items-center flex-col gap-3">
                {url ? (
                      <Image
                      src={url}
                      width={260}
                      height={260}
                      alt="Picture of the Product"
                    />
                ) : (
                  <Loader />
                )}

                <>
                  <label className="label label-info flex items-center gap-2">
                    Uploaded: <span>{progress}%</span>
                    {progress === 100 && (
                      <span className="text-green-600 bg-green-200 p-1 rounded-full">
                        <MdDone size={14} />
                      </span>
                    )}
                  </label>
                </>
              </div>
            ) : (
              <div>
                <div className="w-full text-center">
                  <div>
                    <div className="mx-auto flex justify-center">
                      <BsFillImageFill size={40} />
                    </div>
                    <p className="text-sm mt-2">
                      Select / Drag your image here
                    </p>
                    <em className="text-xs text-gray-400">
                      (Only *.jpeg, jpg, gif and *.png images will be accepted)
                    </em>
                    <h6 className="text-xs text-gray-400"></h6>
                  </div>
                </div>
                <aside className="flex flex-row flex-wrap mt-4"></aside>
              </div>
            )}
          </Dropzone.Idle>
        </Group>
      </Dropzone>
    </div>
  );
};

export default FileUpload;
