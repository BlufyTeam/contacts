"use client";

import { useState, useMemo } from "react"; // useMemo added
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Download, Trash, Search } from "lucide-react"; // Search icon
import { getFileExtension } from "../../Utils/fileTypes";

export default function ITDocumentsTab() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState(""); // Search state

  const utils = api.useUtils();
  const { data: docs, isLoading } = api.itDocument.getAll.useQuery();
  const createDoc = api.itDocument.create.useMutation({
    onSuccess: () => {
      utils.itDocument.getAll.invalidate();
      resetForm();
      setMessage("File uploaded successfully!");
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setMessage("");
      }, 1500);
    },
    onError: (err) => {
      setMessage(`DB Error: ${err.message}`);
      setProgress(0);
    },
  });

  const deleteDoc = api.itDocument.delete.useMutation({
    onSuccess: () => utils.itDocument.getAll.invalidate(),
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file");
    if (!name.trim()) return setMessage("Please enter a document name");

    setMessage("");
    setProgress(10);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(40);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      setProgress(70);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (!data.url) throw new Error("No file URL returned");

      createDoc.mutate({
        name,
        description: description || undefined,
        fileUrl: data.url,
        fileType: data.mimeType ?? "application/octet-stream",
      });
    } catch (err: any) {
      console.error("Upload failed:", err);
      setMessage(`Upload failed: ${err.message}`);
      setProgress(0);
    }
  };

  // Filter documents by name
  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    return docs.filter((doc) =>
      doc.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [docs, search]);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <Input
          placeholder="Document Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type="file"
          accept="*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        Maximum file size:20MB
        {progress > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <Button
          onClick={handleUpload}
          disabled={createDoc.isPending || !file || !name}
          className="w-full"
        >
          {createDoc.isPending ? "Uploading…" : "Add"}
        </Button>
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search files by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Document List */}
      <div>
        {isLoading ? (
          <p className="text-gray-500">Loading documents…</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-gray-500">
            {search ? "No files match your search." : "No documents yet."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredDocs.map((doc) => {
              const fileExt = getFileExtension(doc.fileType);

              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{doc.name}</p>
                    {doc.description && (
                      <p className="text-sm text-gray-500">{doc.description}</p>
                    )}
                    <span className="mt-1 inline-block rounded-full bg-gray-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {fileExt}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDoc.mutate({ id: doc.id })}
                      disabled={deleteDoc.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
