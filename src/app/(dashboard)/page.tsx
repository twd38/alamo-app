import { Countdown } from 'src/components/dashboard/countdown';
import { Editor } from 'src/components/editor/editor';
import { prisma } from 'src/lib/db';

export default async function ProductsPage(
  props: {
    searchParams: Promise<{ q: string; offset: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;

  const getMissionMessage = async () => {
    "use server"
    const missionMessage = await prisma.missionMessage.findFirst();
    return missionMessage;
  }

  const missionMessage = await getMissionMessage();

  return (
    <div className="flex flex-col gap-4">
      <Countdown targetDate={new Date('2025-07-11')} />
      <div className="flex flex-col items-center">
        <Editor initialContent={missionMessage} />
      </div>
    </div>
  );
}
