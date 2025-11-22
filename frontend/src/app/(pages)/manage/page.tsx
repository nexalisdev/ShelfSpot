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
      {/* Modern Page Header */}
      <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-purple-900/20 border border-gray-200/50 dark:border-gray-700/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-purple-400">
                Manage
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage your existing items and create tags. Use the &quot;Create&quot; button in the navigation to add new rooms, places, and containers.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modern Rooms Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rooms</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage existing rooms</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md">
                    {editingRoom === room.id ? (
                      <>
                        <input
                          type="text"
                          value={editValues.name || ''}
                          onChange={(e) => handleEditValueChange(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-3"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRoom(room.id)}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900 dark:text-white">{room.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No rooms found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modern Places Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Places</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage existing places within rooms</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {places.length > 0 ? (
                places.map((place) => (
                  <div key={place.id} className="flex items-center justify-between p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md">
                    {editingPlace === place.id ? (
                      <>
                        <div className="flex-1 mr-3">
                          <input
                            type="text"
                            value={editValues.name || ''}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-1"
                            autoFocus
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {rooms.find(r => r.id === place.roomId)?.name || "Unknown room"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePlace(place.id)}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{place.name}</span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {rooms.find(r => r.id === place.roomId)?.name || "Unknown room"}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlace(place)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlace(place.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No places found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modern Containers Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Containers</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage existing containers within places</p>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {containers.length > 0 ? (
                containers.map((container) => (
                  <div key={container.id} className="flex items-start justify-between p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md">
                    {editingContainer === container.id ? (
                      <>
                        <div className="flex-1 mr-3 space-y-2">
                          <input
                            type="text"
                            value={editValues.name || ''}
                            onChange={(e) => handleEditValueChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Container name"
                            autoFocus
                          />
                          <select
                            value={editValues.roomId || ''}
                            onChange={(e) => handleContainerRoomChange(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="">Select a room</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                          </select>
                          <select
                            value={editValues.placeId || ''}
                            onChange={(e) => handleContainerPlaceChange(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{container.name}</span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {places.find(p => p.id === container.placeId)?.name} • {rooms.find(r => r.id === container.roomId)?.name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditContainer(container)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteContainer(container.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-3 py-1 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No containers found. Create one using the &quot;Create&quot; button in the navigation.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modern Tags Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tags</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage tags for items</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleAddTag} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tagName}
                  onChange={e => setTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-medium rounded-sm transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Add
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto scrollbar-hide">
              {tags.map((tag) => (
                <div key={tag.id} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200/50 dark:border-gray-700/50 rounded-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md">
                  {editingTag === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => handleEditValueChange(e.target.value)}
                        className="text-sm border-none bg-transparent text-gray-900 dark:text-white outline-none w-20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveTag(tag.id)}
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium px-2 py-1 rounded-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium px-2 py-1 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{tag.name}</span>
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
