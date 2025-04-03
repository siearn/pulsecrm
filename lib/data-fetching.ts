import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    const data = await res.json().catch(() => null)
    if (data?.error) {
      error.message = data.error
    }
    throw error
  }
  return res.json()
}

export function useData<T>(url: string | null, options = {}) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    ...options,
  })
}

export async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "Failed to fetch data")
  }
  return response.json()
}

