import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import * as xlsx from "xlsx";
import { db } from "~/server/db"; // Adjust path if needed

export const dynamic = "force-dynamic"; // Required for file upload in App Router

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;

    if (!Array.isArray(sheetNames) || sheetNames.length === 0) {
      return new Response(
        JSON.stringify({ error: "No sheets found in Excel file" }),
        { status: 400 },
      );
    }

    const firstSheetName =
      typeof sheetNames[0] === "string" ? sheetNames[0] : null;

    if (!firstSheetName) {
      return new Response(JSON.stringify({ error: "Invalid sheet name" }), {
        status: 400,
      });
    }

    const sheet = workbook.Sheets[firstSheetName];

    if (!sheet) {
      return new Response(
        JSON.stringify({ error: "Sheet not found in Excel file" }),
        { status: 400 },
      );
    }

    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const contactsToCreate = jsonData.map((row: any) => ({
      fullName: row.fullName || row.name || "",
      email: row.email || "",
      extension: row.extension?.toString() ?? "",
      organizationId: row.organizationId || null, // Optional: map org name to ID
    }));

    for (const contact of contactsToCreate) {
      if (contact.fullName) {
        await db.contact.create({ data: contact });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: contactsToCreate.length,
        data: jsonData,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Excel Import Error:", err);
    return new Response(JSON.stringify({ error: "Failed to process file" }), {
      status: 500,
    });
  }
}
