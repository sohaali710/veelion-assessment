import { NextResponse } from "next/server";
import { getTasksFromBackend } from "@/lib/backendApi";

export async function GET() {
  try {
    const tasks = await getTasksFromBackend();
    console.log(process.env.NEXT_PUBLIC_BACKEND_API_URL);
    return NextResponse.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Unable to fetch tasks.",
        },
      },
      { status: 500 },
    );
  }
}
