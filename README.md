Workout Tracker (Bootstrap web app) - Supabase integration
=========================================================

Files:
 - index.html
 - style.css
 - app.js

Supabase config (already injected):
 - SUPABASE_URL: https://pcpjsuzfbjbsztepcglw.supabase.co
 - SUPABASE_ANON_KEY: sb_publishable_P6awrwvBFtKqWq1Oeihgvg_FFgVBYF7

Instructions:
1) Ensure your Supabase tables exist (profiles, equipment, workouts) with the schema and RLS policies we discussed.
2) Serve locally:
   python3 -m http.server 5500
   Open http://localhost:5500 and click "Login with GitHub" to authenticate.
3) To publish, push these files to a GitHub repository and enable GitHub Pages on the main branch (root).

Policies SQL examples are in the chat. Make sure RLS is enabled on the tables.
