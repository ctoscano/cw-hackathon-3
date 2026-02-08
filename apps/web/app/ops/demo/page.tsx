"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cw-hackathon/ui";
import { Button as HeroButton, Modal, SearchField } from "@heroui/react";
import { useState } from "react";

export default function DemoPage() {
  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="container mx-auto p-8 space-y-12">
      <header className="border-b pb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2">Tailwind CSS v4 Demo</h1>
        <p className="text-base text-muted-foreground">
          Verifying component styling across HeroUI, shadcn/ui, and Tailwind utilities
        </p>
      </header>

      {/* Section 1: HeroUI Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary">
          1. HeroUI v3 Components (@heroui/react)
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>HeroUI Button Variants</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <HeroButton>Primary</HeroButton>
            <HeroButton variant="secondary">Secondary</HeroButton>
            <HeroButton variant="tertiary">Tertiary</HeroButton>
            <HeroButton variant="outline">Outline</HeroButton>
            <HeroButton variant="ghost">Ghost</HeroButton>
            <HeroButton variant="danger">Danger</HeroButton>
            <HeroButton variant="danger-soft">Danger Soft</HeroButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HeroUI SearchField</CardTitle>
          </CardHeader>
          <CardContent>
            <SearchField
              name="demo-search"
              value={searchValue}
              onChange={setSearchValue}
              className="w-full max-w-md"
            >
              <SearchField.Input placeholder="Search for something..." />
            </SearchField>
            <p className="mt-2 text-sm text-muted-foreground">
              Current value:{" "}
              <code className="bg-muted px-2 py-1 rounded">{searchValue || "(empty)"}</code>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HeroUI Modal</CardTitle>
          </CardHeader>
          <CardContent>
            <HeroButton onPress={() => setShowModal(true)}>Open Modal</HeroButton>

            <Modal>
              <Modal.Backdrop isOpen={showModal} onOpenChange={(open) => setShowModal(open)}>
                <Modal.Container>
                  <Modal.Dialog>
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>Demo Modal</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <p>This modal is rendered by HeroUI v3 and styled with Tailwind CSS v4.</p>
                    </Modal.Body>
                    <Modal.Footer>
                      <HeroButton variant="tertiary" onPress={() => setShowModal(false)}>
                        Close
                      </HeroButton>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </CardContent>
        </Card>
      </section>

      {/* Section 2: shadcn/ui Components */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary">
          2. Local shadcn/ui Components (apps/web/components/ui/)
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>shadcn Button Variants</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Example</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Session 001</TableCell>
                  <TableCell>
                    <Badge>Complete</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Intake</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Session 002</TableCell>
                  <TableCell>
                    <Badge variant="secondary">In Progress</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">DAP</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabs Example</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <p className="text-sm">Content for Tab 1</p>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <p className="text-sm">Content for Tab 2</p>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <p className="text-sm">Content for Tab 3</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Tailwind Utilities */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary">3. Tailwind CSS v4 Utilities</h2>

        <Card>
          <CardHeader>
            <CardTitle>Color System (OKLCH)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-primary rounded-lg shadow" />
                <p className="text-xs font-medium">bg-primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-secondary rounded-lg shadow" />
                <p className="text-xs font-medium">bg-secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-accent rounded-lg shadow" />
                <p className="text-xs font-medium">bg-accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-muted rounded-lg shadow" />
                <p className="text-xs font-medium">bg-muted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spacing & Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">Padding: p-4</p>
            </div>
            <div className="p-6 bg-muted rounded-lg">
              <p className="text-sm">Padding: p-6</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                <p className="text-xs">Responsive Grid</p>
              </div>
              <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                <p className="text-xs">1 col mobile</p>
              </div>
              <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                <p className="text-xs">3 cols desktop</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs">Extra Small (text-xs)</p>
            <p className="text-sm">Small (text-sm)</p>
            <p className="text-base">Base (text-base)</p>
            <p className="text-lg">Large (text-lg)</p>
            <p className="text-xl">Extra Large (text-xl)</p>
            <p className="text-2xl">2XL (text-2xl)</p>
            <p className="text-3xl">3XL (text-3xl)</p>
            <p className="text-4xl">4XL (text-4xl)</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
