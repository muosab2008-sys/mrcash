"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Coins } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { mockOffers } from "@/lib/mock-data";

export default function AdminOffersPage() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredOffers = mockOffers.filter(
    (offer) =>
      offer.name.toLowerCase().includes(search.toLowerCase()) ||
      offer.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers</h1>
          <p className="text-sm text-muted-foreground">
            Manage all offers on the platform
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Offer
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search offers..."
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
              <TableHead className="text-muted-foreground">OFFER</TableHead>
              <TableHead className="text-muted-foreground">PARTNER</TableHead>
              <TableHead className="text-muted-foreground">POINTS</TableHead>
              <TableHead className="text-muted-foreground">PLATFORMS</TableHead>
              <TableHead className="text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-right text-muted-foreground">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map((offer) => (
              <TableRow key={offer.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="font-bold text-primary">
                        {offer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{offer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {offer.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {offer.partnerName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">
                      {offer.points.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {offer.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      offer.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {offer.isActive ? "Active" : "Inactive"}
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

      {/* Add Offer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle>Add New Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Offer Name</FieldLabel>
                <Input placeholder="Enter offer name" className="bg-input" />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="Enter offer description"
                  className="bg-input"
                />
              </Field>
              <Field>
                <FieldLabel>Points</FieldLabel>
                <Input
                  type="number"
                  placeholder="Enter points value"
                  className="bg-input"
                />
              </Field>
              <Field>
                <FieldLabel>Tracking URL</FieldLabel>
                <Input
                  placeholder="https://..."
                  className="bg-input"
                />
              </Field>
              <Field>
                <FieldLabel>Platforms</FieldLabel>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="android" />
                    <label htmlFor="android" className="text-sm">Android</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="ios" />
                    <label htmlFor="ios" className="text-sm">iOS</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="desktop" />
                    <label htmlFor="desktop" className="text-sm">Desktop</label>
                  </div>
                </div>
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddModal(false)}>Add Offer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
