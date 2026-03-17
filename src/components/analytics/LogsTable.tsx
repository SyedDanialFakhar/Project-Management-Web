export default function LogsTable({ logs, loadMore }: any) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Event</th>
              <th>Value</th>
              <th>Date</th>
            </tr>
          </thead>
  
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.event_type}</td>
                <td>{log.event_value}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
  
        <button onClick={loadMore} className="mt-4 w-full border py-2 rounded">
          Load More
        </button>
      </div>
    );
  }