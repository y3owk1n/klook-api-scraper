const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://zwjvntbvejwqjrnvfwzh.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3anZudGJ2ZWp3cWpybnZmd3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTI2MjMwMSwiZXhwIjoxOTYwODM4MzAxfQ.tHdHzTKoFkgH55TCg2Vxl0HG6q-Vp21HeiGEAPMtEfw";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
};
