import React from 'react';
import { Button, ButtonGroup, FieldGroup, Icon, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useForm } from '../../../../hooks/useForm';
import { useUserSubscription } from '../../../../contexts/UserContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useCustomSound } from '../../../../contexts/CustomSoundContext';
import { useEndpointActionExperimental } from '../../../../hooks/useEndpointAction';
import VerticalBar from '../../../../components/VerticalBar';
import { Preferences } from './components/Preferences';
import { NotificationByDevice } from './components/NotificationByDevice';
import { NotificationToogle } from './components/NotificationToogle';
import { useTabBarClose } from '../../providers/ToolboxProvider';

export const NotificationPreferences = ({
	handleClose,
	formValues,
	formHandlers,
	formHasUnsavedChanges,
	handlePlaySound,
	handleOptions,
	handleSaveButton,
	hasSubscription,
}) => {
	const t = useTranslation();
	if (!hasSubscription) {
		return <>
			<VerticalBar.Header>
				<VerticalBar.Icon name='bell'/>
				<VerticalBar.Text>{t('Notifications_Preferences')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose}/>}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Box>{t('error-user-not-in-room')}</Box>
			</VerticalBar.ScrollableContent>
		</>;
	}
	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='bell'/>
			<VerticalBar.Text>{t('Notifications_Preferences')}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose}/>}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			<NotificationToogle label={t('Turn_ON')} description={t('Receive_alerts')} onChange={formHandlers.handleTurnOn} defaultChecked={formValues.turnOn}/>
			<NotificationToogle label={t('Mute_Group_Mentions')} onChange={formHandlers.handleMuteGroupMentions} defaultChecked={formValues.muteGroupMentions}/>
			<NotificationToogle label={t('Show_counter')} description={t('Display_unread_counter')} onChange={formHandlers.handleShowCounter} defaultChecked={formValues.showCounter} />
			<FieldGroup>
				<NotificationByDevice device={t('Desktop')} icon={'computer'}>
					<Preferences id={'DesktopAlert'} onChange={formHandlers.handleDesktopAlert} name={t('Alerts')} options={handleOptions.alerts} optionDefault={formValues.desktopAlert} />
					<Preferences id={'DesktopAudio'} onChange={formHandlers.handleDesktopAudio} name={t('Audio')} options={handleOptions.audio} optionDefault={formValues.desktopAudio} />
					<Preferences id={'DesktopSound'} onChange={formHandlers.handleDesktopSound} name={t('Sound')} options={handleOptions.sound} optionDefault={formValues.desktopSound}>
						<Button mis='x4' square ghost onClick={handlePlaySound}>
							<Icon name='play' size='x18' />
						</Button>
					</Preferences>
				</NotificationByDevice>
				<NotificationByDevice device={t('Mobile')} icon={'mobile'}>
					<Preferences id={'MobileAlert'} onChange={formHandlers.handleMobileAlert} name={t('Alerts')} options={handleOptions.alerts} optionDefault={formValues.mobileAlert} />
				</NotificationByDevice>
				<NotificationByDevice device={t('Email')} icon={'mail'}>
					<Preferences id={'EmailAlert'} onChange={formHandlers.handleEmailAlert} name={t('Alerts')} options={handleOptions.alerts} optionDefault={formValues.emailAlert} />
				</NotificationByDevice>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup stretch>
				{handleClose && <Button onClick={handleClose}>{t('Cancel')}</Button>}
				<Button primary disabled={!formHasUnsavedChanges} onClick={handleSaveButton}>{t('Save')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</>;
};

export default React.memo(({ rid }) => {
	const t = useTranslation();
	const handleClose = useTabBarClose();

	const subscription = useUserSubscription(rid);
	if (!subscription) {
		return (
			<NotificationPreferences
				hasSubscription={false}
				handleClose={handleClose}
			/>
		);
	}

	const customSound = useCustomSound();
	const saveSettings = useEndpointActionExperimental('POST', 'rooms.saveNotification', t('Room_updated_successfully'));
	const { values, handlers, hasUnsavedChanges, commit } = useForm(
		{
			turnOn: !subscription.disableNotifications,
			muteGroupMentions: subscription.muteGroupMentions,
			showCounter: !subscription.hideUnreadStatus,
			desktopAlert: (subscription.desktopPrefOrigin === 'subscription' && subscription.desktopNotifications) || 'default',
			desktopAudio: (subscription.audioPrefOrigin === 'subscription' && subscription.audioNotifications) || 'default',
			desktopSound: subscription.audioNotificationValue || 'default',
			mobileAlert: (subscription.mobilePrefOrigin === 'subscription' && subscription.mobilePushNotifications) || 'default',
			emailAlert: (subscription.emailPrefOrigin === 'subscription' && subscription.emailNotifications) || 'default',
		},
	);

	const defaultOption = [
		['default', t('Default')],
		['all', t('All_messages')],
		['mentions', t('Mentions')],
		['nothing', t('Nothing')],
	];

	const customSoundAsset = Object.entries(customSound.list.get()).map((value) => [value[0], value[1].name]);

	const handleOptions = {
		alerts: defaultOption,
		audio: defaultOption,
		sound: [
			['none None', t('None')],
			['default', t('Default')],
			...customSoundAsset,
		],
	};

	const handlePlaySound = () => customSound.play(values.desktopSound);

	const handleSaveButton = useMutableCallback(() => {
		const notifications = {};

		notifications.disableNotifications = values.turnOn ? '0' : '1';
		notifications.muteGroupMentions = values.muteGroupMentions ? '1' : '0';
		notifications.hideUnreadStatus = values.showCounter ? '0' : '1';
		notifications.desktopNotifications = values.desktopAlert;
		notifications.audioNotifications = values.desktopAudio;
		notifications.audioNotificationValue = values.desktopSound;
		notifications.mobilePushNotifications = values.mobileAlert;
		notifications.emailNotifications = values.emailAlert;

		saveSettings({
			roomId: rid,
			notifications,
		});

		commit();
	});

	return (
		<NotificationPreferences
			handleClose={handleClose}
			formValues={values}
			formHandlers={handlers}
			formHasUnsavedChanges={hasUnsavedChanges}
			handlePlaySound={handlePlaySound}
			handleOptions={handleOptions}
			handleSaveButton={handleSaveButton}
			hasSubscription={true}
		/>
	);
});
