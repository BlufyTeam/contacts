"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { getFileExtension } from "../Utils/fileTypes";

export default function ITPage() {
  const { data: files, isLoading } = api.itDocument.getAll.useQuery();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const displayedFiles = useMemo(() => {
    if (!files) return [];
    let result = files.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    );
    result.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return result;
  }, [files, search, sortAsc]);

  const pageCount = Math.ceil(displayedFiles.length / itemsPerPage);
  const paginatedFiles = displayedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, pageCount));

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <Link href="/">
        <ArrowLeft className="cursor-pointer text-gray-600 hover:text-gray-800" />
      </Link>
      <h1 className="mt-5 mb-6 text-3xl font-bold">IT</h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">IT Files</h2>

        {/* Search + Sort */}
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <Button
            onClick={() => setSortAsc((prev) => !prev)}
            className="sm:ml-2"
          >
            Sort: {sortAsc ? "A to Z" : "Z to A"}
          </Button>
        </div>

        {/* File Grid */}
        {isLoading ? (
          <p className="text-gray-500">Loading files...</p>
        ) : paginatedFiles.length === 0 ? (
          <p className="text-gray-500">No files found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedFiles.map((file) => {
              const fileExt = getFileExtension(file.fileType);

              return (
                <div
                  key={file.id}
                  className="flex h-full flex-col rounded border bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  {/* File Name */}
                  <h3 className="truncate text-sm font-medium text-gray-800">
                    {file.name}
                  </h3>

                  {/* Description */}
                  {file.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {file.description}
                    </p>
                  )}

                  {/* Spacer to push footer down */}
                  <div className="flex-1" />

                  {/* Footer: Badge (left) + Download (right) */}
                  <div className="mt-3 flex items-center justify-between pt-2">
                    {/* File Type Badge */}
                    <span className="inline-block rounded-full bg-gray-600 px-2 py-0.5 text-xs font-bold text-white">
                      {fileExt}
                    </span>

                    {/* Download Button */}
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={handlePrev} disabled={currentPage === 1} size="sm">
              Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              onClick={handleNext}
              disabled={currentPage === pageCount}
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
