import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Ban,
  CheckCircle,
  Info,
  HelpCircle,
  Flag,
  Target,
  Skull,
  Castle,
  Crown,
  Bomb
} from 'lucide-react';

function Section({ icon: Icon, iconColor, title, children }) {
  return (
    <section className="rounded-2xl bg-panel p-6">
      <h2 className="mb-4 flex items-center font-display text-xl font-bold text-ink">
        <Icon size={20} className={`mr-2 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubCard({ title, children }) {
  return (
    <div className="rounded-xl bg-panel-raised p-4">
      {title && <h3 className="mb-2 text-sm font-medium text-hud">{title}</h3>}
      {children}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">How to Use the Veto Tool</h1>
        <Link to="/" className="flex items-center text-sm text-hud hover:underline">
          <span>Return to App</span>
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Overview Section */}
        <Section icon={Info} iconColor="text-hud" title="Overview">
          <p className="mb-4 font-sans text-sm text-ink-muted">
            The TSD Veto Tool is designed to manage the map and mode selection process for competitive gaming series.
            It supports both objective and slayer game modes, and handles the entire pick/ban process from start to finish.
          </p>
          <SubCard title="Key Features">
            <ul className="list-disc space-y-1 pl-6 font-sans text-sm text-ink-muted">
              <li>Create and manage Bo3, Bo5 and Bo7 series</li>
              <li>Team-based ban phase for objective and slayer maps</li>
              <li>Map picks phase based off the structure of the series</li>
              <li>Visual game layout displaying the final series arrangement</li>
              <li>Random series generation for practice and testing</li>
            </ul>
          </SubCard>
        </Section>

        {/* Creating a Series */}
        <Section icon={CheckCircle} iconColor="text-hud" title="Creating a Series">
          <div className="space-y-4">
            <SubCard title='Step 1 · Click "New Series"'>
              <p className="font-sans text-sm text-ink-muted">
                Click the "New Series" button in the top right corner of the main page to start creating a new series.
              </p>
            </SubCard>

            <SubCard title="Step 2 · Configure Series Settings">
              <ul className="list-disc space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li>Select series type (Bo3, Bo5 or Bo7)</li>
                <li>Enter team names for Team A and Team B</li>
                <li>Choose additional settings if available</li>
                <li>Click "Start Veto Process" to proceed</li>
              </ul>
            </SubCard>
          </div>
        </Section>

        {/* Ban Phase */}
        <Section icon={Ban} iconColor="text-warn" title="Ban Phase">
          <p className="mb-4 font-sans text-sm text-ink-muted">
            The ban phase allows each team to eliminate maps and modes from the available pool. Teams take turns banning until the required number of bans is complete.
          </p>
          <div className="space-y-4">
            <SubCard title="How to Ban">
              <ol className="list-decimal space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li>The Turn Beacon at the top shows whose turn it is</li>
                <li>Select a map-mode combo from the grid</li>
                <li>Click "Confirm Ban" to finalize your ban</li>
                <li>The ban will be recorded and the turn will switch to the other team</li>
              </ol>
            </SubCard>

            <SubCard title="Ban Types">
              <ul className="space-y-2 pl-6 font-sans text-sm text-ink-muted">
                <li className="flex items-center">
                  <Ban size={16} className="mr-2 text-warn" />
                  <span><strong className="text-ink">Objective Bans:</strong> Eliminate specific map and objective mode combinations</span>
                </li>
                <li className="flex items-center">
                  <Ban size={16} className="mr-2 text-warn" />
                  <Target size={16} className="mr-2 text-warn" />
                  <span><strong className="text-ink">Slayer Bans:</strong> Eliminate entire maps from the slayer pool</span>
                </li>
              </ul>
            </SubCard>
          </div>
        </Section>

        {/* Pick Phase */}
        <Section icon={CheckCircle} iconColor="text-hud" title="Pick Phase">
          <p className="mb-4 font-sans text-sm text-ink-muted">
            After bans are complete, teams take turns selecting maps and modes for the series. The pick order is predetermined based on the series type.
          </p>
          <div className="space-y-4">
            <SubCard title="How to Pick">
              <ol className="list-decimal space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li>The type of pick (Objective or Slayer) will be indicated</li>
                <li>Available maps and modes will be shown based on what hasn't been banned</li>
                <li>Select your preferred map-mode combination</li>
                <li>The pick is confirmed immediately on selection</li>
              </ol>
            </SubCard>

            <SubCard title="Game Mode Icons">
              <ul className="grid grid-cols-1 gap-2 pl-6 font-sans text-sm text-ink-muted md:grid-cols-2">
                <li className="flex items-center">
                  <Target size={16} className="mr-2 text-team-red" />
                  <span><strong className="text-ink">Slayer</strong></span>
                </li>
                <li className="flex items-center">
                  <Flag size={16} className="mr-2 text-team-blue" />
                  <span><strong className="text-ink">Capture the Flag</strong></span>
                </li>
                <li className="flex items-center">
                  <Skull size={16} className="mr-2 text-hud" />
                  <span><strong className="text-ink">Oddball</strong></span>
                </li>
                <li className="flex items-center">
                  <Castle size={16} className="mr-2 text-hud" />
                  <span><strong className="text-ink">Strongholds</strong></span>
                </li>
                <li className="flex items-center">
                  <Crown size={16} className="mr-2 text-warn" />
                  <span><strong className="text-ink">King of the Hill</strong></span>
                </li>
                <li className="flex items-center">
                  <Bomb size={16} className="mr-2 text-team-red" />
                  <span><strong className="text-ink">Neutral Bomb</strong></span>
                </li>
              </ul>
            </SubCard>
          </div>
        </Section>

        {/* Series Layout */}
        <Section icon={Flag} iconColor="text-hud" title="Series Layout">
          <p className="mb-4 font-sans text-sm text-ink-muted">
            The Series Layout shows the current state of the series, including bans and the final game order.
          </p>
          <div className="space-y-4">
            <SubCard title="Reading the Layout">
              <ul className="list-disc space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li><strong className="text-ink">Objective Bans:</strong> Shows all banned objective map-mode combinations</li>
                <li><strong className="text-ink">Slayer Bans:</strong> Shows all banned slayer maps</li>
                <li><strong className="text-ink">Game Layout:</strong> Shows the final order of maps and modes for the series</li>
              </ul>
            </SubCard>

            <SubCard title="Series Completion">
              <p className="font-sans text-sm text-ink-muted">
                Once all picks are complete, the Series Layout will display the full series configuration. This can be used by tournament organizers to set up the matches.
              </p>
            </SubCard>
          </div>
        </Section>

        {/* Tips and Best Practices */}
        <Section icon={HelpCircle} iconColor="text-warn" title="Tips and Best Practices">
          <div className="space-y-4">
            <SubCard title="For Custom Games and Tournament Organizers">
              <ul className="list-disc space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li>Set up the series before teams arrive to save time</li>
                <li>Consider having a practice run to familiarize teams with the tool</li>
                <li>Verify bans and picks with both teams after each selection</li>
                <li>Take a screenshot of the final layout for reference</li>
              </ul>
            </SubCard>

            <SubCard title="For Teams">
              <ul className="list-disc space-y-1 pl-6 font-sans text-sm text-ink-muted">
                <li>Plan your bans and picks in advance</li>
                <li>Consider banning maps where your opponent is known to be strong</li>
                <li>Think about game flow when making picks (e.g., alternating high and low intensity modes)</li>
                <li>Verify each selection before confirming</li>
              </ul>
            </SubCard>
          </div>
        </Section>

        <div className="py-6 text-center">
          <Link to="/" className="inline-flex items-center rounded-lg bg-hud px-6 py-3 font-medium text-void transition-colors hover:bg-hud/90">
            <span>Return to Veto Tool</span>
            <ChevronRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
