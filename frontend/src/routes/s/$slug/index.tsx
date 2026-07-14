import { createFileRoute } from '@tanstack/react-router'
import { StorefrontPublic } from '@/features/storefront-public'

export const Route = createFileRoute('/s/$slug/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { slug } = Route.useParams()
  return <StorefrontPublic slug={slug} />
}
