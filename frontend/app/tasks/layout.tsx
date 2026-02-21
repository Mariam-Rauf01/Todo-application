import ChatBotWrapper from '../components/ChatBotWrapper';

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ChatBotWrapper />
      {children}
    </>
  );
}
