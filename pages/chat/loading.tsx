export default function ChatLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-white flex">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Tabs */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg mb-2">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
