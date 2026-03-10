"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockPartners } from "@/lib/mock-data";

export default function AdminPartnersPage() {
  const [search, setSearch] = useState("");

  const filteredPartners = mockPartners.filter((partner) =>
    partner.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground">
            Manage partner networks and offerwall providers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-input pl-9"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">PARTNER</TableHead>
              <TableHead className="text-muted-foreground">BADGE</TableHead>
              <TableHead className="text-muted-foreground">RATING</TableHead>
              <TableHead className="text-muted-foreground">FEATURED</TableHead>
              <TableHead className="text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-right text-muted-foreground">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow key={partner.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="font-bold text-primary">
                        {partner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {partner.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {partner.badge && (
                    <Badge
                      style={{ backgroundColor: partner.badgeColor }}
                      className="border-0"
                    >
                      {partner.badge}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < partner.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      partner.featured
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {partner.featured ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      partner.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {partner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
