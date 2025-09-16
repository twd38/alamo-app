import { MarkdownEditor } from '@/components/markdown-editor';
import { prisma } from '@/lib/db';
import Countdown from '@/components/home/countdown';
import { Card, CardContent } from '@/components/ui/card';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const launchDate = new Date('2025-12-01');

  const missionMessage = await prisma.missionMessage.findFirst();
  const missionMessageId = missionMessage?.id;
  const initialContent = missionMessage?.content;

  const updateMessage = async (content: string) => {
    'use server';

    if (content === null) {
      return;
    }

    if (missionMessageId === null) {
      return await prisma.missionMessage.create({
        data: {
          content
        }
      });
    }

    return await prisma.missionMessage.update({
      where: { id: missionMessageId },
      data: { content }
    });
  };

  return (
    <div className="flex flex-col">
      <BasicTopBar />
      <PageContainer>
        <Countdown targetDate={launchDate} />
        <div className="flex flex-col items-center mt-4">
          <Card className="w-full shadow-sm">
            <CardContent className="p-6">
              <MarkdownEditor
                initialContent={initialContent}
                updateContent={updateMessage}
                hideWordCount
              />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
