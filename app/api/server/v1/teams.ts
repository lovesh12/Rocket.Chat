import { Promise } from 'meteor/promise';
// import { Meteor } from 'meteor/meteor';
// import { Match, check } from 'meteor/check';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
import { hasPermission } from '../../../authorization/server';
// import { BannerPlatform } from '../../../../definition/IBanner';

API.v1.addRoute('teams.list', { authRequired: true }, {
	get() {
		const teams = Promise.await(Team.list(this.userId));

		return API.v1.success({ teams });
	},
});

API.v1.addRoute('teams.listAll', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-all-teams')) {
			return API.v1.unauthorized();
		}

		return API.v1.success(Team.listAll());
	},
});

API.v1.addRoute('teams.create', { authRequired: true }, {
	post() {
		const { name, type, members, room } = this.bodyParams;

		if (!name) {
			return API.v1.failure('Body param "name" is required');
		}

		const team = Promise.await(Team.create(this.userId, {
			team: {
				name,
				type,
			},
			room,
			members,
		}));

		return API.v1.success({ team });
	},
});

API.v1.addRoute('teams.delete', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'delete-team')) {
			return API.v1.unauthorized();
		}

		const { teamId, teamName } = this.bodyParams;

		if (!teamId && !teamName) {
			return API.v1.failure('Provide either a teamId or teamName in request body');
		}

		teamId
			? Promise.await(Team.deleteById(teamId))
			: Promise.await(Team.deleteByName(teamName));

		return API.v1.success();
	},
});
