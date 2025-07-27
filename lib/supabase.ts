import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}

export async function logUserActivity(userId: string, activityType: string, activityData?: any) {
  try {
    const supabase = getSupabaseClient()
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      activity_data: activityData,
    })
  } catch (error) {
    console.error("Error logging user activity:", error)
  }
}

export async function uploadFile(file: File, bucket: string, path: string) {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path)

    return { data, publicUrl }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteFile(bucket: string, path: string) {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) throw error
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}
