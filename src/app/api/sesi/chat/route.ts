import { NextRequest, NextResponse } from "next/server";
import { chatWithSesiAI, SesiAIMessage } from "@/lib/sesi/brain";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, history }: { message: string; mode: "baby" | "doctor" | "reveal"; history: SesiAIMessage[] } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages: SesiAIMessage[] = [{ role: "user", content: message }];

    const response = await chatWithSesiAI(messages, mode, history);

    return NextResponse.json({
      text: response.text,
      mode: response.mode,
      chartData: response.chartData,
      recommendedProductId: response.recommendedProductId,
    });
  } catch (error) {
    console.error("Sesi AI API error:", error);
    return NextResponse.json(
      { error: "Failed to get Sesi response", text: "eee! Sesi is having trouble thinking right now... ✨" },
      { status: 500 }
    );
  }
}
