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

export default function HelpPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">How to Use the Veto Tool</h1>
        <Link to="/" className="text-blue-400 hover:underline flex items-center">
          <span>Return to App</span>
          <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="space-y-8">
        {/* Overview Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Info size={20} className="mr-2 text-blue-400" />
            Overview
          </h2>
          <p className="text-gray-300 mb-4">
            The TSD Veto Tool is designed to manage the map and mode selection process for competitive gaming series. 
            It supports both objective and slayer game modes, and handles the entire pick/ban process from start to finish.
          </p>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2">Key Features:</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>Create and manage Bo5 and Bo7 series</li>
              <li>Team-based ban phase for objective and slayer maps</li>
              <li>Map selection phase with smart filtering</li>
              <li>Visual game layout displaying the final series arrangement</li>
              <li>Random series generation for practice and testing</li>
            </ul>
          </div>
        </section>
        
        {/* Creating a Series */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CheckCircle size={20} className="mr-2 text-green-400" />
            Creating a Series
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Step 1: Click "New Series"</h3>
              <p className="text-gray-300">
                Click the "New Series" button in the top right corner of the main page to start creating a new series.
              </p>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Step 2: Configure Series Settings</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Select series type (Bo5 or Bo7)</li>
                <li>Enter team names for Team A and Team B</li>
                <li>Choose additional settings if available</li>
                <li>Click "Create Series" to proceed</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Ban Phase */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Ban size={20} className="mr-2 text-red-400" />
            Ban Phase
          </h2>
          <p className="text-gray-300 mb-4">
            The ban phase allows each team to eliminate maps and modes from the available pool. Teams take turns banning until the required number of bans is complete.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">How to Ban:</h3>
              <ol className="list-decimal pl-6 text-gray-300 space-y-1">
                <li>The team whose turn it is will be indicated at the top</li>
                <li>Select a map-mode combination from the dropdown</li>
                <li>Click "Confirm Ban" to finalize your ban</li>
                <li>The ban will be recorded and the turn will switch to the other team</li>
              </ol>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Ban Types:</h3>
              <ul className="pl-6 text-gray-300 space-y-2">
                <li className="flex items-center">
                  <Ban size={16} className="mr-2 text-red-400" /> 
                  <span><strong>Objective Bans:</strong> Eliminate specific map and objective mode combinations</span>
                </li>
                <li className="flex items-center">
                  <Ban size={16} className="mr-2 text-red-400" /> 
                  <Target size={16} className="mr-2 text-red-400" /> 
                  <span><strong>Slayer Bans:</strong> Eliminate entire maps from the slayer pool</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Pick Phase */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <CheckCircle size={20} className="mr-2 text-green-400" />
            Pick Phase
          </h2>
          <p className="text-gray-300 mb-4">
            After bans are complete, teams take turns selecting maps and modes for the series. The pick order is predetermined based on the series type.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">How to Pick:</h3>
              <ol className="list-decimal pl-6 text-gray-300 space-y-1">
                <li>The type of pick (Objective or Slayer) will be indicated</li>
                <li>Available maps and modes will be shown based on what hasn't been banned</li>
                <li>Select your preferred map-mode combination</li>
                <li>Click "Confirm Pick" to finalize your selection</li>
              </ol>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Game Mode Icons:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 text-gray-300">
                <li className="flex items-center">
                  <Target size={16} className="mr-2 text-red-400" /> 
                  <span><strong>Slayer</strong></span>
                </li>
                <li className="flex items-center">
                  <Flag size={16} className="mr-2 text-blue-400" /> 
                  <span><strong>Capture the Flag</strong></span>
                </li>
                <li className="flex items-center">
                  <Skull size={16} className="mr-2 text-green-400" /> 
                  <span><strong>Oddball</strong></span>
                </li>
                <li className="flex items-center">
                  <Castle size={16} className="mr-2 text-purple-400" /> 
                  <span><strong>Strongholds</strong></span>
                </li>
                <li className="flex items-center">
                  <Crown size={16} className="mr-2 text-yellow-400" /> 
                  <span><strong>King of the Hill</strong></span>
                </li>
                <li className="flex items-center">
                  <Bomb size={16} className="mr-2 text-orange-400" /> 
                  <span><strong>Neutral Bomb</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Series Layout */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Flag size={20} className="mr-2 text-blue-400" />
            Series Layout
          </h2>
          <p className="text-gray-300 mb-4">
            The Series Layout shows the current state of the series, including bans and the final game order.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Reading the Layout:</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li><strong>Objective Bans:</strong> Shows all banned objective map-mode combinations</li>
                <li><strong>Slayer Bans:</strong> Shows all banned slayer maps</li>
                <li><strong>Game Layout:</strong> Shows the final order of maps and modes for the series</li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Series Completion:</h3>
              <p className="text-gray-300">
                Once all picks are complete, the Series Layout will display the full series configuration. This can be used by tournament organizers to set up the matches.
              </p>
            </div>
          </div>
        </section>
        
        {/* Tips and Best Practices */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <HelpCircle size={20} className="mr-2 text-yellow-400" />
            Tips and Best Practices
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">For Tournament Organizers:</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Set up the series before teams arrive to save time</li>
                <li>Consider having a practice run to familiarize teams with the tool</li>
                <li>Verify bans and picks with both teams after each selection</li>
                <li>Take a screenshot of the final layout for reference</li>
              </ul>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">For Teams:</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Plan your bans and picks in advance</li>
                <li>Consider banning maps where your opponent is known to be strong</li>
                <li>Think about game flow when making picks (e.g., alternating high and low intensity modes)</li>
                <li>Verify each selection before confirming</li>
              </ul>
            </div>
          </div>
        </section>
        
        <div className="text-center py-6">
          <Link to="/" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
            <span className="font-medium">Return to Veto Tool</span>
            <ChevronRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}