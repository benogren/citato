import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { scheduledFunctions } from './config.ts'

serve(async (req) => {
  try {
    const { name = '' } = await req.json()
    const foundFunction = scheduledFunctions.find((fn) => fn.name === name)
    
    if (!foundFunction) {
      return new Response(
        JSON.stringify({ error: `Function ${name} not found` }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Make a request to invoke the specified function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/${foundFunction.invoke}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    )

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})