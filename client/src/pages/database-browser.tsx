import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Table, 
  Search, 
  Download,
  Upload,
  RefreshCw,
  Plus,
  Filter,
  FileJson,
  Code
} from 'lucide-react';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DatabaseTable {
  name: string;
  rowCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
  }>;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export default function DatabaseBrowser() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tables');
  const { toast } = useToast();
  
  // Get database tables
  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useQuery({
    queryKey: ['/api/database/tables']
  });
  
  // Get table data
  const { data: tableData, isLoading: dataLoading } = useQuery({
    queryKey: ['/api/database/table', selectedTable],
    enabled: !!selectedTable
  });
  
  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest('POST', '/api/database/query', { query });
    },
    onSuccess: (data) => {
      toast({
        title: "Query Executed",
        description: `Returned ${data.rowCount} rows in ${data.executionTime}ms`
      });
    },
    onError: (error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Export table mutation
  const exportTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const response = await apiRequest('POST', '/api/database/export', { tableName });
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
      return response;
    },
    onSuccess: (_, tableName) => {
      toast({
        title: "Export Successful",
        description: `Table ${tableName} exported successfully`
      });
    }
  });
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleRunQuery = () => {
    if (sqlQuery.trim()) {
      executeQueryMutation.mutate(sqlQuery);
    }
  };
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--github-dark)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8" />
              Database Browser
            </h1>
            <p className="text-gray-400 mt-1">Explore and manage your database</p>
          </div>
          <Button variant="outline" onClick={() => refetchTables()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tables</CardTitle>
                <div className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tables..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {tablesLoading ? (
                    <p className="p-4 text-center text-gray-400">Loading...</p>
                  ) : filteredTables.length === 0 ? (
                    <p className="p-4 text-center text-gray-400">No tables found</p>
                  ) : (
                    filteredTables.map((table) => (
                      <div
                        key={table.name}
                        className={`p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 ${
                          selectedTable === table.name ? 'bg-gray-800' : ''
                        }`}
                        onClick={() => setSelectedTable(table.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Table className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{table.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {table.rowCount} rows
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Table Details / Query */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tables">Table Data</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="query">SQL Query</TabsTrigger>
              </TabsList>
              
              {/* Table Data */}
              <TabsContent value="tables">
                {selectedTable ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{selectedTable}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTableMutation.mutate(selectedTable)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          <Button size="sm" variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dataLoading ? (
                        <p className="text-center py-8 text-gray-400">Loading data...</p>
                      ) : tableData?.rows?.length === 0 ? (
                        <p className="text-center py-8 text-gray-400">No data in this table</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <UITable>
                            <TableHeader>
                              <TableRow>
                                {tableData?.columns?.map((column) => (
                                  <TableHead key={column}>{column}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData?.rows?.slice(0, 100).map((row, idx) => (
                                <TableRow key={idx}>
                                  {tableData.columns.map((column) => (
                                    <TableCell key={column} className="font-mono text-sm">
                                      {row[column]?.toString() || 'NULL'}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </UITable>
                          {tableData?.rows?.length > 100 && (
                            <p className="text-center text-sm text-gray-400 mt-4">
                              Showing first 100 rows of {tableData.rows.length}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400">Select a table to view its data</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Table Structure */}
              <TabsContent value="structure">
                {selectedTable ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedTable} Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UITable>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Key</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tables.find(t => t.name === selectedTable)?.columns.map((column) => (
                            <TableRow key={column.name}>
                              <TableCell className="font-mono">{column.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{column.type}</Badge>
                              </TableCell>
                              <TableCell>{column.nullable ? 'Yes' : 'No'}</TableCell>
                              <TableCell>
                                {column.primaryKey && (
                                  <Badge className="bg-yellow-600">PK</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileJson className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400">Select a table to view its structure</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* SQL Query */}
              <TabsContent value="query">
                <Card>
                  <CardHeader>
                    <CardTitle>SQL Query</CardTitle>
                    <CardDescription>
                      Execute custom SQL queries on your database
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <textarea
                        className="w-full h-40 p-3 rounded-md bg-gray-800 font-mono text-sm"
                        placeholder="SELECT * FROM users LIMIT 10;"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Import SQL
                        </Button>
                        <Button variant="outline" size="sm">
                          <Code className="h-4 w-4 mr-2" />
                          Format
                        </Button>
                      </div>
                      <Button 
                        onClick={handleRunQuery}
                        disabled={!sqlQuery.trim() || executeQueryMutation.isPending}
                      >
                        Run Query
                      </Button>
                    </div>
                    
                    {/* Query Results */}
                    {executeQueryMutation.data && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Results</h3>
                        <div className="overflow-x-auto">
                          <UITable>
                            <TableHeader>
                              <TableRow>
                                {executeQueryMutation.data.columns.map((column) => (
                                  <TableHead key={column}>{column}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {executeQueryMutation.data.rows.map((row, idx) => (
                                <TableRow key={idx}>
                                  {executeQueryMutation.data.columns.map((column) => (
                                    <TableCell key={column} className="font-mono text-sm">
                                      {row[column]?.toString() || 'NULL'}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </UITable>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {executeQueryMutation.data.rowCount} rows in {executeQueryMutation.data.executionTime}ms
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}