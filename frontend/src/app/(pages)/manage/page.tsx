"use client";

import { useEffect, useState } from "react";
import { backendApi } from "@/lib/backend-api";

// Types
interface Room { id: number; name: string; }
interface Place { id: number; name: string; roomId: number; }
interface Container { id: number; name: string; roomId: number; placeId: number; }
interface Tag { id: number; name: string; }

const ManagePage = () => {
  // Form states (only for tags)
  const [tagName, setTagName] = useState("");

  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Edit states
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [editingPlace, setEditingPlace] = useState<number | null>(null);
  const [editingContainer, setEditingContainer] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string | number | null>>({});

  // Fetch all data
  const fetchAll = async () => {
    try {
      const [roomsData, placesData, containersData, tagsData] = await Promise.all([
        backendApi.getRooms(),
        backendApi.getPlaces(),
        backendApi.getContainers(),
        backendApi.getTags(),
      ]);
      setRooms(roomsData);
      setPlaces(placesData);
      setContainers(containersData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Delete handlers
  const handleDeleteRoom = async (id: number) => {
    try {
      await backendApi.deleteRoom(id);
      fetchAll();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleDeletePlace = async (id: number) => {
    try {
      await backendApi.deletePlace(id);
      fetchAll();
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  const handleDeleteContainer = async (id: number) => {
    try {
      await backendApi.deleteContainer(id);
      fetchAll();
    } catch (error) {
      console.error('Error deleting container:', error);
    }
  };

  // Tag handlers
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await backendApi.createTag({ name: tagName });
      setTagName("");
      fetchAll();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleDeleteTag = async (id: number) => {
    // Find the tag name for confirmation
    const tagToDelete = tags.find(tag => tag.id === id);
    const tagName = tagToDelete ? tagToDelete.name : 'this tag';

    // Show confirmation before deletion
    if (window.confirm(`Are you sure you want to delete the tag "${tagName}"? This action is irreversible.`)) {
      try {
        await backendApi.deleteTag(id);
        fetchAll();
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  // Edit handlers
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room.id);
    setEditValues({ name: room.name });
  };

  const handleEditPlace = (place: Place) => {
    setEditingPlace(place.id);
    setEditValues({ name: place.name });
  };

  const handleEditContainer = (container: Container) => {
    setEditingContainer(container.id);
    setEditValues({
      name: container.name,
      roomId: container.roomId,
      placeId: container.placeId
    });
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditValues({ name: tag.name });
  };

  const handleSaveRoom = async (id: number) => {
    try {
      await backendApi.updateRoom(id, { name: editValues.name as string });
      setEditingRoom(null);
      setEditValues({});
      fetchAll();
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const handleSavePlace = async (id: number) => {
    try {
      await backendApi.updatePlace(id, { name: editValues.name as string });
      setEditingPlace(null);
      setEditValues({});
      fetchAll();
    } catch (error) {
      console.error('Error updating place:', error);
    }
  };

  const handleSaveContainer = async (id: number) => {
    try {
      await backendApi.updateContainer(id, {
        name: editValues.name as string,
        roomId: editValues.roomId as number,
        placeId: editValues.placeId as number
      });
      setEditingContainer(null);
      setEditValues({});
      fetchAll();
    } catch (error) {
      console.error('Error updating container:', error);
    }
  };

  const handleSaveTag = async (id: number) => {
    try {
      await backendApi.updateTag(id, { name: editValues.name as string });
      setEditingTag(null);
      setEditValues({});
      fetchAll();
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setEditingPlace(null);
    setEditingContainer(null);
    setEditingTag(null);
    setEditValues({});
  };

  const handleEditValueChange = (value: string) => {
    setEditValues({ ...editValues, name: value });
  };

  const handleContainerRoomChange = (roomId: number) => {
    setEditValues({
      ...editValues,
      roomId: roomId,
      placeId: null // Reset place when room changes
    });
  };

  const handleContainerPlaceChange = (placeId: number) => {
    setEditValues({ ...editValues, placeId: placeId });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="app-panel-elevated relative overflow-hidden px-6 py-8 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-accent" />
          <h1 className="app-heading text-3xl font-bold text-foreground">Manage</h1>
        </div>
        <p className="app-muted mt-2 text-lg leading-relaxed">
          Manage your existing items and create tags. Use the &quot;Create&quot; button in the navigation to add new rooms, places, and containers.
        </p>
      </div>

      {/* Modern Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rooms Section */}
        <div className="app-panel">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 rounded-full bg-accent"></div>
              <h2 className="text-xl font-bold text-foreground">Rooms</h2>
            </div>
            <p className="text-sm text-muted-foreground">Manage existing rooms</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                    {editingRoom === room.id ? (
                      <>
                        <input
                          type="text"
                          value={editValues.name || ''}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground mr-3"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRoom(room.id)}
                            className="min-h-[44px] text-accent hover:text-accent/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-sm hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{room.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="min-h-[44px] text-destructive hover:text-destructive/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No rooms found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Places Section */}
        <div className="app-panel">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 rounded-full bg-accent"></div>
              <h2 className="text-xl font-bold text-foreground">Places</h2>
            </div>
            <p className="text-sm text-muted-foreground">Manage existing places within rooms</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {places.length > 0 ? (
                places.map((place) => (
                  <div key={place.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                    {editingPlace === place.id ? (
                      <>
                        <div className="flex-1 mr-3">
                          <input
                            type="text"
                            value={editValues.name || ''}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground mb-1"
                            autoFocus
                          />
                          <div className="text-xs text-muted-foreground">
                            {rooms.find(r => r.id === place.roomId)?.name || "Unknown room"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePlace(place.id)}
                            className="min-h-[44px] text-accent hover:text-accent/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-sm hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-semibold text-foreground">{place.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {rooms.find(r => r.id === place.roomId)?.name || "Unknown room"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlace(place)}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlace(place.id)}
                            className="min-h-[44px] text-destructive hover:text-destructive/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No places found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Containers Section */}
        <div className="app-panel">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 rounded-full bg-accent"></div>
              <h2 className="text-xl font-bold text-foreground">Containers</h2>
            </div>
            <p className="text-sm text-muted-foreground">Manage existing containers within places</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {containers.length > 0 ? (
                containers.map((container) => (
                  <div key={container.id} className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                    {editingContainer === container.id ? (
                      <>
                        <div className="flex-1 mr-3 space-y-2">
                          <input
                            type="text"
                            value={editValues.name || ''}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground"
                            placeholder="Container name"
                            autoFocus
                          />
                          <select
                            value={editValues.roomId || ''}
                            onChange={(e) => handleContainerRoomChange(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground"
                          >
                            <option value="">Select a room</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                          </select>
                          <select
                            value={editValues.placeId || ''}
                            onChange={(e) => handleContainerPlaceChange(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground"
                            disabled={!editValues.roomId}
                          >
                            <option value="">Select a place</option>
                            {places
                              .filter(p => p.roomId === editValues.roomId)
                              .map(place => (
                                <option key={place.id} value={place.id}>{place.name}</option>
                              ))}
                          </select>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleSaveContainer(container.id)}
                            className="min-h-[44px] text-accent hover:text-accent/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-sm hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-semibold text-foreground">{container.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {places.find(p => p.id === container.placeId)?.name} • {rooms.find(r => r.id === container.roomId)?.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditContainer(container)}
                            className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1 rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteContainer(container.id)}
                            className="min-h-[44px] text-destructive hover:text-destructive/80 text-sm font-medium px-3 py-1 rounded-lg hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No containers found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="app-panel">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 rounded-full bg-accent"></div>
              <h2 className="text-xl font-bold text-foreground">Tags</h2>
            </div>
            <p className="text-sm text-muted-foreground">Create and manage tags for items</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleAddTag} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tagName}
                  onChange={e => setTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                  required
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                >
                  Add
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto scrollbar-hide">
              {tags.map((tag) => (
                <div key={tag.id} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                  {editingTag === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => handleEditValueChange(e.target.value)}
                        className="text-sm border-none bg-transparent text-foreground outline-none w-20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTag(tag.id)}
                        aria-label="Save tag"
                        className="min-h-[44px] text-accent hover:text-accent/80 text-sm font-medium px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        aria-label="Cancel edit"
                        className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-2 py-1 rounded-sm hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-foreground">{tag.name}</span>
                      <button
                        onClick={() => handleEditTag(tag)}
                        aria-label={`Edit tag ${tag.name}`}
                        className="min-h-[44px] text-muted-foreground hover:text-foreground text-sm font-medium px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        aria-label={`Delete tag ${tag.name}`}
                        className="min-h-[44px] text-destructive hover:text-destructive/80 text-sm font-medium px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePage;
