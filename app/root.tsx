import { json, LoaderArgs, MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import type { Database } from "db_types";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";

import createServerSupabase from "utils/supabase.server"
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { SupabaseClient } from "@supabase/supabase-js";

type TypedSupabaseClient = SupabaseClient<Database>

export type SupabaseOutletContext = {
  supabase: TypedSupabaseClient;
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "ff klappen",
  viewport: "width=device-width,initial-scale=1",
});

export const loader = async ({request}: LoaderArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
  }

  const response = new Response();
  const supabase = createServerSupabase({request, response})

  const {
    data: { session }
  } = await supabase.auth.getSession(); 

  return json({ env, session }, { headers: response.headers})
}

export default function App() {
  const fetcher = useFetcher();
  const { env, session } = useLoaderData<typeof loader>();
  console.log({server: {session}})

  const [supabase] = useState(()=> createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));

  const serverAccessToken = session?.access_token; 

  useEffect(()=>{
    supabase.auth.getSession()
      .then((session) => {console.log({client: {session}})})
      const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
        if(session?.access_token !== serverAccessToken) {
          fetcher.submit(null, {
            method: "post",
            action: "handle-supabase-auth"
          })
        }
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, supabase, fetcher])
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet context={{ supabase }}/>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}