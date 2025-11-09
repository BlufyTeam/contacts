import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { db } from "~/server/db"; // Adjust path to your Prisma client

export async function GET() {
  try {
    // Fetch contacts with their organizations
    const contacts = await db.contact.findMany({
      include: {
        organization: true,
      },
    });

    // Map contacts to plain JSON objects with desired columns
    const data = contacts.map((c) => ({
      fullName: c.fullName,
      email: c.email,
      extension: c.extension,
      organization: c.organization?.name ?? "",
    }));

    // Create a new workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Append worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Contacts");

    // Write workbook to buffer
    const excelBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Return buffer as a response with correct headers for download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="contacts.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export contacts error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to export contacts" }),
      { status: 500 },
    );
  }
}
