import { CopyButton } from "./CopyButton.tsx"
import { Field } from "./Field.tsx"

interface UrlBarProps {
	href: string
	onEdit: (typedHref: string) => boolean
}

export function UrlBar(props: UrlBarProps) {
	return (
		<div class="flex items-start gap-1">
			<label class="group/field flex min-w-0 flex-1 flex-col gap-1">
				<span class="field-label">Full URL</span>
				<Field
					label="Full URL"
					textAtRest={props.href}
					onEdit={props.onEdit}
					rejectionMessage="Not a complete URL; include a scheme such as https://"
					shouldEmphasizeHost
				/>
			</label>
			<div class="mt-5">
				<CopyButton label="Copy URL" textToCopy={props.href} />
			</div>
		</div>
	)
}
