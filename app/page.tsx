import { Shield, AlertTriangle, Brain, Database, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Tracium</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">AI Risk Intelligence Agent</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">Tracium</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Slack AI Risk Intelligence Agent
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Not a chatbot. A passive monitoring agent that analyzes team conversations,
            identifies risks, and proactively alerts your team to potential issues.
          </p>
          <div className="flex items-center justify-center gap-4">
            <code className="bg-muted px-4 py-2 rounded-lg text-sm">
              POST /api/slack/events
            </code>
          </div>
        </div>
      </section>

      {/* Risk Categories */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">Risk Categories Monitored</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Product', icon: '📦', desc: 'User experience, market fit' },
              { name: 'Engineering', icon: '⚙️', desc: 'Technical quality, architecture' },
              { name: 'Marketing', icon: '📢', desc: 'Messaging integrity, claims' },
              { name: 'Operational', icon: '🔧', desc: 'Process, coordination' },
              { name: 'Launch', icon: '🚀', desc: 'Release risks, deployment' },
              { name: 'Security', icon: '🔒', desc: 'Vulnerabilities, access' },
            ].map((cat) => (
              <div key={cat.name} className="p-4 rounded-lg border bg-card text-center">
                <div className="text-2xl mb-2">{cat.icon}</div>
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border bg-card">
              <AlertTriangle className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Risk Detection</h3>
              <p className="text-sm text-muted-foreground">
                Monitors messages for risky keywords and patterns in real-time
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Brain className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Uses Qwen to score risk (1-10), identify category, and explain consequences
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Zap className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Thread Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Posts actionable alerts with safer alternatives directly in Slack threads
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Database className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Data Persistence</h3>
              <p className="text-sm text-muted-foreground">
                Stores risks, decisions, and action items for future reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">Example Response</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <span className="text-sm font-medium">Team Message:</span>
              <p className="mt-2 text-muted-foreground">&quot;Let&apos;s disable payment validation temporarily.&quot;</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚨</span>
                <span className="font-semibold">Tracium Risk Detected</span>
                <span className="text-lg">⚠️</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Risk Score:</span>{' '}
                  <span className="text-red-500 font-bold">8.7/10</span>
                </div>
                <div>
                  <span className="font-medium">Category:</span>{' '}
                  <span>Security</span>
                </div>
                <div>
                  <span className="font-medium">Potential Consequences:</span>
                  <p className="text-muted-foreground mt-1">
                    Invalid transactions could process without proper verification,
                    leading to revenue leakage and compliance violations.
                  </p>
                </div>
                <div>
                  <span className="font-medium">Suggested Alternative:</span>
                  <p className="text-muted-foreground mt-1">
                    Use feature flags to gradually roll out changes while maintaining
                    validation checks, with proper monitoring in place.
                  </p>
                </div>
                <div>
                  <span className="font-medium">Recommended Action:</span>
                  <p className="text-muted-foreground mt-1">
                    Create a rollout plan with approval review from security and finance teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">Additional Intelligence</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-3">Decision Extraction</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Identifies and stores team decisions with owners for future reference.
              </p>
              <div className="text-xs bg-muted p-3 rounded font-mono">
                &quot;We decided to launch on Monday&quot; → Decision stored
              </div>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-3">Action Item Detection</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extracts tasks and owners from conversations automatically.
              </p>
              <div className="text-xs bg-muted p-3 rounded font-mono">
                &quot;TODO: Sarah to review PR&quot; → Action item created
              </div>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-3">Unresolved Discussions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Flags discussions that need follow-up or resolution.
              </p>
              <div className="text-xs bg-muted p-3 rounded font-mono">
                &quot;Let&apos;s discuss later&quot; → Discussion flagged
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Integrations */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">Future Integrations Ready</h2>
          <p className="text-muted-foreground mb-8">
            Architecture prepared for seamless integration with external tools:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Jira', 'GitHub Issues', 'GitLab Issues', 'Linear'].map((tool) => (
              <div key={tool} className="px-4 py-2 rounded-full border bg-card text-sm">
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">Tracium</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI Risk Intelligence Agent for Slack
          </p>
          <Link
            href="https://github.com"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View on GitHub
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
