import Link from 'next/link';

const teamcenterBaseUrl = process.env.NEXT_PUBLIC_TEAMCENTER_URL;

type TeamcenterLinkProps = {
  partNumber: string;
};

const TeamcenterLink = ({ partNumber }: TeamcenterLinkProps) => {
  return (
    <Link
      href={`${teamcenterBaseUrl}?searchCriteria=${partNumber}&secondaryCriteria=*&isGlobalSearch=true`}
      target="_blank"
    >
      <img src="/images/tc-logo.png" alt="Teamcenter" className="w-5 h-5" />
    </Link>
  );
};

export { TeamcenterLink };
