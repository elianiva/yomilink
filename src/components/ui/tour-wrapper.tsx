import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import type { TourConfig } from "@/lib/tours";

export function TourWrapper({ tourConfig }: { tourConfig: TourConfig }) {
	const [run, setRun] = useState(true);

	const hasCompleted = localStorage.getItem(`tour_${tourConfig.id}_completed`);

	useEffect(() => {
		if (!hasCompleted) {
			setRun(true);
		}
	}, [hasCompleted]);

	const handleJoyrideCallback = (data: CallBackProps) => {
		const { status } = data;

		if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
			setRun(false);
			localStorage.setItem(`tour_${tourConfig.id}_completed`, "true");
		}
	};

	if (hasCompleted) {
		return null;
	}

	return (
		<Joyride
			run={run}
			steps={tourConfig.steps}
			continuous
			showSkipButton
			showProgress
			callback={handleJoyrideCallback}
			styles={{
				options: {
					zIndex: 10000,
				},
				spotlight: {
					borderRadius: 8,
				},
			}}
		/>
	);
}
