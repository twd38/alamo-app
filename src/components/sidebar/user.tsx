import { Button } from 'src/components/ui/button';
import { auth, signOut } from 'src/lib/auth';
import { getUserAccessBadge } from 'src/lib/queries';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from 'src/components/ui/dropdown-menu';
import Link from 'next/link';
import { BadgeQRDialog } from './badge-qr-dialog';

export async function User() {
  const session = await auth();
  const user = session?.user;

  // Fetch user's access badge if user exists
  let badge = null;
  if (user?.id) {
    badge = await getUserAccessBadge(user.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Image
            src={user?.image ?? '/placeholder-user.jpg'}
            width={36}
            height={36}
            alt="Avatar"
            className="overflow-hidden rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {badge && (
          <>
            <DropdownMenuItem asChild>
              <div className="p-0">
                <BadgeQRDialog badgeId={badge.id} />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem>
            <form
              action={async () => {
                'use server';
                await signOut();
              }}
            >
              <button type="submit">Sign Out</button>
            </form>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <Link href="/login">Sign In</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
