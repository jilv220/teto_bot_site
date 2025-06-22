import {
  createLyrics,
  deleteLyrics,
  getAllLyrics,
  updateLyrics,
} from '@/actions/lyrics'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { Lyrics } from '@/repositories/lyrics'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Edit, Music, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  loader: async () => await getAllLyrics(),
})

function Dashboard() {
  const router = useRouter()
  const lyricsResult = Route.useLoaderData()
  const lyrics = 'data' in lyricsResult ? lyricsResult.data.lyrics || [] : []

  // Use server function hooks
  const createLyricsAction = useServerFn(createLyrics)
  const updateLyricsAction = useServerFn(updateLyrics)
  const deleteLyricsAction = useServerFn(deleteLyrics)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLyrics, setEditingLyrics] = useState<Lyrics | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    lyrics: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingLyrics) {
        // Update existing lyrics
        const result = await updateLyricsAction({
          data: {
            artist: editingLyrics.artist,
            title: editingLyrics.title,
            lyrics: formData.lyrics,
          },
        })
        if ('data' in result) {
          router.invalidate()
        }
      } else {
        // Create new lyrics
        const result = await createLyricsAction({
          data: {
            title: formData.title,
            artist: formData.artist,
            lyrics: formData.lyrics,
          },
        })
        if ('data' in result) {
          router.invalidate()
        }
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Failed to save lyrics:', error)
    }
  }

  const handleDelete = async (artist: string, title: string) => {
    try {
      const result = await deleteLyricsAction({
        data: { artist, title },
      })
      if ('data' in result) {
        router.invalidate()
      }
    } catch (error) {
      console.error('Failed to delete lyrics:', error)
    }
  }

  const handleEdit = (item: Lyrics) => {
    setEditingLyrics(item)
    setFormData({
      title: item.title,
      artist: item.artist,
      lyrics: item.lyrics,
    })
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingLyrics(null)
    setFormData({
      title: '',
      artist: '',
      lyrics: '',
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingLyrics(null)
    setFormData({
      title: '',
      artist: '',
      lyrics: '',
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Lyrics Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Manage your lyrics collection</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Lyrics</CardTitle>
              <CardDescription>
                {lyrics.length} song{lyrics.length !== 1 ? 's' : ''} in your
                collection
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lyrics
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lyrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lyrics found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first song lyrics
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lyrics
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lyrics.map((item) => (
                  <TableRow key={`${item.title}-${item.artist}`}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.artist}</TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lyrics</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"
                                by {item.artist}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(item.artist, item.title)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLyrics ? 'Edit Lyrics' : 'Add New Lyrics'}
            </DialogTitle>
            <DialogDescription>
              {editingLyrics
                ? `Edit the lyrics for "${editingLyrics.title}" by ${editingLyrics.artist}`
                : 'Add new lyrics to your collection'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter song title"
                    required
                    disabled={!!editingLyrics}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        artist: e.target.value,
                      }))
                    }
                    placeholder="Enter artist name"
                    required
                    disabled={!!editingLyrics}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lyrics">Lyrics</Label>
                <Textarea
                  id="lyrics"
                  value={formData.lyrics}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lyrics: e.target.value }))
                  }
                  placeholder="Enter the song lyrics..."
                  required
                  className="min-h-48 max-h-48 overflow-y-auto resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLyrics ? 'Update Lyrics' : 'Add Lyrics'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
