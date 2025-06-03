import { MarkdownEditor } from '@/components/markdown-editor';
import { prisma } from '@/lib/db';
import Countdown from '@/components/home/countdown'
import { updateMissionMessage } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import BasicTopBar from "@/components/layouts/basic-top-bar";
import PageContainer from '@/components/page-container';
import { getMissionMessage } from "@/lib/queries";
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  
  const launchDate = new Date('2025-09-24');

  const missionMessage = await getMissionMessage()
  const missionMessageId = missionMessage?.id
  const initialContent = missionMessage?.content

  const updateMessage = async(content: string) => {
    "use server"

    if (missionMessageId) {
      await updateMissionMessage(missionMessageId, content);
    }
  }

  return (
    <div className="flex flex-col">
      <BasicTopBar />
      <PageContainer>
        <Countdown targetDate={launchDate} />
        <div className="flex flex-col items-center mt-4">
          <Card className="w-full shadow-sm">
            <CardContent className="p-6">
              <MarkdownEditor initialContent={initialContent} updateContent={updateMessage} hideWordCount />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}