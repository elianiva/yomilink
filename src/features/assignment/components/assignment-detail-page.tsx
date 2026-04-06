// Assignment Detail Page - Presentational Component

import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, UsersIcon, BookOpenIcon, ClipboardListIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AssignmentDetailPageProps {
    assignment: {
        id: string;
        title: string;
        description: string | null;
        goalMapId: string;
        goalMapTitle: string | null;
        startDate: Date | null;
        dueAt: Date | null;
        preTestFormId: string | null;
        postTestFormId: string | null;
        delayedPostTestFormId: string | null;
        tamFormId: string | null;
        delayedPostTestDelayDays: number | null;
        createdAt: Date;
        updatedAt: Date;
    };
}

export function AssignmentDetailPage({ assignment }: AssignmentDetailPageProps) {
    const formattedStartDate = assignment.startDate
        ? new Date(assignment.startDate).toLocaleDateString()
        : "Not set";

    const formattedDueDate = assignment.dueAt
        ? new Date(assignment.dueAt).toLocaleDateString()
        : "No due date";

    const timeAgo = assignment.createdAt
        ? formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })
        : "";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary">
                            <ClipboardListIcon className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-medium">{assignment.title}</h1>
                    </div>
                    {assignment.description && (
                        <p className="text-muted-foreground max-w-2xl">{assignment.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Created {timeAgo}</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Goal Map</CardTitle>
                        <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">
                            {assignment.goalMapTitle || "Unknown"}
                        </div>
                        <p className="text-xs text-muted-foreground">Learning material</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{formattedStartDate}</div>
                        <p className="text-xs text-muted-foreground">
                            {assignment.startDate
                                ? "Assignment starts"
                                : "Immediately when published"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-medium">{formattedDueDate}</div>
                        <p className="text-xs text-muted-foreground">
                            {assignment.dueAt ? "Assignment deadline" : "No deadline set"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Overview</CardTitle>
                            <CardDescription>
                                Summary of the assignment configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Assignment ID</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {assignment.id}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Goal Map ID</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {assignment.goalMapId}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="forms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Associated Forms</CardTitle>
                            <CardDescription>Forms linked to this assignment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {assignment.preTestFormId && (
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Pre-Test Form</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {assignment.preTestFormId}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">Required</Badge>
                                    </div>
                                )}
                                {assignment.postTestFormId && (
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Post-Test Form</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {assignment.postTestFormId}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">Required</Badge>
                                    </div>
                                )}
                                {!assignment.preTestFormId && !assignment.postTestFormId && (
                                    <p className="text-sm text-muted-foreground">
                                        No forms attached to this assignment
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Assigned Students</CardTitle>
                                <CardDescription>
                                    Students participating in this assignment
                                </CardDescription>
                            </div>
                            <UsersIcon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                View the student list from the main assignments page.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Settings</CardTitle>
                            <CardDescription>Configure assignment parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Delayed Post-Test</p>
                                    <p className="text-sm text-muted-foreground">
                                        {assignment.delayedPostTestDelayDays
                                            ? `${assignment.delayedPostTestDelayDays} days after submission`
                                            : "Not configured"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">TAM Survey</p>
                                    <p className="text-sm text-muted-foreground">
                                        {assignment.tamFormId ? "Enabled" : "Not configured"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
