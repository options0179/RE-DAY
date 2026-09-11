export default function CopilotPage() {
  return (
    <main className="copilot-shell">
      <iframe
        className="copilot-frame"
        src="https://copilotstudio.microsoft.com/environments/Default-a5a060c4-00b2-4343-b6c9-23625439a0c0/bots/cr9fa_reday_4T-Zrr/webchat?__version__=2&enableFileAttachment=false&cliAgent=true"
        title="RE:DAY Copilot Agent"
        allow="microphone"
      />
    </main>
  );
}
