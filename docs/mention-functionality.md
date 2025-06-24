# User Mention Functionality in TipTap Editor

This document describes the user mention functionality that has been added to the TipTap text editor component.

## Overview

The enhanced TipTap editor now supports user mentions, allowing users to tag other users in text content using the `@` symbol. When users are mentioned, they can be notified through the application's notification system.

## Features

- **@mention autocomplete**: Type `@` to trigger a dropdown list of users
- **User search**: Filter users by name or email as you type
- **Keyboard navigation**: Use arrow keys to navigate the suggestion list
- **Visual indicators**: Mentioned users are highlighted with distinct styling
- **Mention tracking**: The editor tracks which users have been mentioned
- **Responsive design**: Works on mobile and desktop devices

## Components Added

### 1. Enhanced TipTap Editor (`src/components/ui/tiptap-text-editor.tsx`)

The main editor component has been extended with the following new props:

```typescript
interface TipTapTextEditorProps {
  // ... existing props
  /** Enable user mentions */
  enableMentions?: boolean;
  /** Callback when users are mentioned */
  onMention?: (mentionedUserIds: string[]) => void;
}
```

### 2. Mention List Component (`src/components/ui/mention-list.tsx`)

A dropdown component that displays user suggestions when typing `@`:

- Shows user avatar, name, and email
- Supports keyboard navigation
- Handles user selection
- Loading states for async user fetching

### 3. Mention Utilities (`src/lib/mention-utils.ts`)

Utility functions for fetching users:

- `getUsersForMention()`: Server-side function for fetching users
- `getUsersForMentionClient()`: Client-side function for API calls
- `getUserForMention()`: Get specific user by ID

### 4. API Endpoint (`src/app/api/users/mention/route.ts`)

REST API endpoint for fetching users:

- `GET /api/users/mention?q=search&limit=10`
- Returns user data filtered by search query
- Implements proper authentication checks

## Usage

### Basic Usage

```typescript
import { TipTapTextEditor } from '@/components/ui/tiptap-text-editor';

function MyComponent() {
  const [content, setContent] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  return (
    <TipTapTextEditor
      enableMentions={true}
      onContentChange={setContent}
      onMention={setMentionedUsers}
      placeholder="Type @ to mention users..."
    />
  );
}
```

### With Submit Button

```typescript
<TipTapTextEditor
  enableMentions={true}
  onContentChange={setContent}
  onMention={setMentionedUsers}
  submitButton={
    <Button onClick={handleSubmit}>
      Post Comment
    </Button>
  }
/>
```

### Example Component

See `src/components/ui/tiptap-text-editor-example.tsx` for a complete working example.

## How It Works

1. **Trigger**: User types `@` or clicks the mention button in the toolbar
2. **Search**: As the user types, the system searches for matching users
3. **Selection**: User selects a user from the dropdown list
4. **Insertion**: The mention is inserted into the editor as a styled node
5. **Tracking**: The `onMention` callback is called with mentioned user IDs

## Styling

Mentioned users are styled with the following CSS classes:

```css
.mention {
  background-color: rgb(219 234 254); /* bg-blue-100 */
  color: rgb(30 64 175); /* text-blue-800 */
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 500;
}

/* Dark mode */
.dark .mention {
  background-color: rgb(30 58 138); /* dark:bg-blue-900 */
  color: rgb(147 197 253); /* dark:text-blue-300 */
}
```

## Integration with Notifications

The mention functionality is designed to integrate with the existing notification system:

```typescript
// In your submit handler
const handleSubmit = async () => {
  // Save content
  await saveContent(content);

  // Send notifications to mentioned users
  if (mentionedUsers.length > 0) {
    await createMentionNotifications(mentionedUsers, content);
  }
};
```

## Database Integration

The system uses the existing User model from Prisma schema:

```prisma
model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  image String?
  // ... other fields
}
```

## Security Considerations

- Authentication is required to fetch users for mentions
- Users can only see and mention users they have permission to view
- All user data is filtered through proper authentication checks
- The API endpoint validates user permissions

## Dependencies

The following packages were added to support mentions:

- `@tiptap/extension-mention`: Core mention functionality
- `@tiptap/suggestion`: Suggestion system for autocomplete
- `tippy.js`: Positioning library for suggestion popup

## Browser Support

The mention functionality works in all modern browsers that support:

- ES6+ JavaScript features
- CSS Grid and Flexbox
- Modern DOM APIs

## Performance Notes

- User search is debounced to avoid excessive API calls
- Suggestion popup is lazy-loaded to reduce initial bundle size
- User avatars are optimized with the Next.js Image component

## Troubleshooting

### Common Issues

1. **Mention popup not appearing**: Ensure `enableMentions={true}` is set
2. **No users in dropdown**: Check API endpoint and authentication
3. **Styling issues**: Verify Tailwind CSS classes are properly loaded
4. **TypeScript errors**: Ensure all types are properly imported

### Debug Mode

Enable debug logging by setting:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Mentioned users:', mentionedUsers);
}
```

## Future Enhancements

Potential improvements for the mention system:

- **Groups/Teams**: Mention entire teams or groups
- **Role-based mentions**: Mention users by role (e.g., @admins)
- **External integrations**: Slack, email notifications
- **Advanced search**: Search by department, location, etc.
- **Mention analytics**: Track mention frequency and patterns
