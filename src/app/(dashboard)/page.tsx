import { MarkdownEditor } from '@/components/markdown-editor';
import { prisma } from '@/lib/db';
import Countdown from '@/components/home/countdown'
import { updateMissionMessage } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProductsPage(
  props: {
    searchParams: Promise<{ q: string; offset: string }>;
  }
) {
  const searchParams = await props.searchParams;

  const getMissionMessage = async () => {
    "use server"
    const missionMessage = await prisma.missionMessage.findFirst();
    return missionMessage;
  }

  const missionMessage = await getMissionMessage();

  const updateMessage = async (content: string) => {
    "use server"
    if (!missionMessage) return;
    await updateMissionMessage(missionMessage.id, content);
  }

  if (!missionMessage) return null;

  return (
    <div className="flex flex-col gap-4">
      <Countdown targetDate={new Date('2025-07-11')} />
      <div className="flex flex-col items-center">
        <Card className="w-full shadow-sm">
          <CardContent className="p-6">
            <MarkdownEditor initialContent={missionMessage.content} updateContent={updateMessage} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
