import React, { useState } from "react";
import { DefaultButton, TextField } from "@fluentui/react";
import styles from "./UploadFile.module.css";

export function UploadFile(): JSX.Element {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [textInput, setTextInput] = useState<string>("");
    const [htmlOutput, setHtmlOutput] = useState<string>(""); // For text output
    const [imageLinks, setImageLinks] = useState<{ url: string; fileName: string }[]>([]); // For image download links

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const response = await fetch("/uploadfile", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    setUploadStatus("File uploaded successfully!");
                } else {
                    setUploadStatus("Failed to upload file.");
                }
            } catch (error) {
                setUploadStatus("An error occurred during the upload.");
            }
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch("/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: textInput })
            });

            if (response.ok) {
                let result = await response.text();

                // Extract and handle images
                const imageLinks: { url: string; fileName: string }[] = [];
                result = result.replace(/<img[^>]+src="([^">]+)"/g, (match, p1) => {
                    // Extract the image data URL or image URL
                    const url = p1; // Assuming p1 contains the base64 or URL
                    const fileName = `image_${imageLinks.length + 1}.png`; // Naming each image sequentially
                    imageLinks.push({ url, fileName }); // Store the URL and filename for download links
                    return ""; // Remove image tag from the HTML result
                });

                setUploadStatus("Processing completed successfully!");
                setHtmlOutput(result); // Store the modified HTML result (without images) in the state
                setImageLinks(imageLinks); // Store the image download links
            } else {
                setUploadStatus("Failed to process data.");
            }
        } catch (error) {
            setUploadStatus("An error occurred during processing.");
            console.error("Error:", error);
        }
    };

    return (
        <div className={styles.uploadContainer}>
            <div className={styles.uploadTopSection}>
                <h1 className={styles.uploadTitle}>Upload a File</h1>
                <div className={styles.uploadInputContainer}>
                    <input type="file" onChange={handleFileChange} className={styles.uploadInput} />
                </div>
                <div className={styles.uploadButtonContainer}>
                    <DefaultButton text="Upload" onClick={handleUpload} disabled={!selectedFile} className={styles.uploadButton} />
                    {uploadStatus && <div className={styles.uploadStatusMessage}>{uploadStatus}</div>}
                </div>
            </div>
            <div className={styles.textInputContainer}>
                <TextField
                    value={textInput}
                    onChange={(e, newValue) => setTextInput(newValue || "")}
                    placeholder="Enter text here"
                    className={styles.textInput}
                />
            </div>
            <div className={styles.submitButtonContainer}>
                <DefaultButton text="Submit" onClick={handleSubmit} className={styles.submitButton} />
            </div>

            {/* Render the HTML output below the Submit button */}
            {htmlOutput && <div className={styles.htmlOutputContainer} dangerouslySetInnerHTML={{ __html: htmlOutput }} />}

            {/* Render download links for the images */}
            {imageLinks.length > 0 && (
                <div className={styles.imageLinksContainer}>
                    <h3>Download Images</h3>
                    <ul>
                        {imageLinks.map((link, index) => (
                            <li key={index}>
                                <a href={link.url} download={link.fileName}>
                                    {`Download Image ${index + 1}`}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

UploadFile.displayName = "UploadFile";
