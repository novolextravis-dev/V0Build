import { supabase } from "./supabase"
import type { FileNode, Message } from "./types"

export interface Project {
  id: string
  name: string
  description: string
  files: FileNode[]
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export async function saveProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">,
  projectId?: string,
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const projectData = {
      user_id: user.id,
      name: project.name,
      description: project.description,
      files_data: project.files,
      messages_data: project.messages,
      updated_at: new Date().toISOString(),
    }

    if (projectId) {
      const { error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", projectId)
        .eq("user_id", user.id)

      if (error) throw error
      return projectId
    } else {
      const { data, error } = await supabase
        .from("projects")
        .insert([{ ...projectData, created_at: new Date().toISOString() }])
        .select("id")
        .single()

      if (error) throw error
      return data?.id || null
    }
  } catch (error) {
    console.error("Failed to save project:", error)
    return null
  }
}

export async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (error || !data) throw error || new Error("Project not found")

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      files: data.files_data || [],
      messages: data.messages_data || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error("Failed to load project:", error)
    return null
  }
}

export async function listProjects(): Promise<
  Array<{ id: string; name: string; description: string; updatedAt: Date }>
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        updatedAt: new Date(p.updated_at),
      })) || []
    )
  } catch (error) {
    console.error("Failed to list projects:", error)
    return []
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Failed to delete project:", error)
    return false
  }
}
