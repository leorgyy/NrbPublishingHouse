define("NrbPeriodicalPublicationsPage", ["NrbConst"], function(NrbConst) {
	return {
		entitySchemaName: "NrbPeriodicalPublications",
		attributes: {
			"NrbResponsiblePerson": {
				lookupListConfig: {
					columns: ["Age", "Gender"],
					filter: function() {
						return this.getResponsiblePersonFilter();
					}
				}
			},
			/**
			 * Привязка обработчика изменения состояния Активно.
			 */
			"NrbIsActive": {
				dependencies: [{
					columns: ["NrbIsActive"],
					methodName: "onActivityChanged"
				}]
			},

			/**
			 * Сохранена ли карточка.
			 */
			"NrbIsSaved": {
				"type": BPMSoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"dataValueType": BPMSoft.DataValueType.BOOLEAN,
				"value": false
			},

			/**
			 * Новая ли карточка.
			 */
			"NrbIsNew": {
				"type": BPMSoft.ViewModelColumnType.VIRTUAL_COLUMN,
				"dataValueType": BPMSoft.DataValueType.BOOLEAN,
				"value": false
			},
		},
		modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		details: /**SCHEMA_DETAILS*/{
			"Files": {
				"schemaName": "FileDetailV2",
				"entitySchemaName": "NrbPeriodicalPublicationsFile",
				"filter": {
					"masterColumn": "Id",
					"detailColumn": "NrbPeriodicalPublications"
				}
			},
			"NrbReleaseDetail": {
				"schemaName": "NrbReleaseDetail",
				"entitySchemaName": "NrbRelease",
				"filter": {
					"detailColumn": "NrbPeriodicalPublications",
					"masterColumn": "Id"
				}
			}
		}/**SCHEMA_DETAILS*/,
		businessRules: /**SCHEMA_BUSINESS_RULES*/{}/**SCHEMA_BUSINESS_RULES*/,
		methods: {

			onSaved: function() {
				this.set("NrbIsSaved", true);

				this.callParent(arguments);
			},

			/**
			 * Инициализация сущности.
			 */
			entityInitialized: function() {
				this.callParent(arguments);

				this.set("NrbIsNew", this.isNew);
				this.onActivityChanged();
			},

			getActions: function() {
				const actions = this.callParent(arguments);

				actions.addItem(this.getButtonMenuItem({
					Caption: {bindTo: "Resources.Strings.NrbAddPublicationAction"},
					Tag: "addPerformances",
				}))
			},

			addPerformances: function(){
				
			},

			/**
			 * /**
			 * Асинхронная валидациия при сохранении и изменении записей.
			 * @param {*} callback Функция обратного вызова.
			 * @param {*} scope Контекст выполнения.
			 */ 
			asyncValidate: function(callback, scope) {
				this.callParent([function(response) {
					if (!this.validateResponse(response)) {
						return;
					}

					BPMSoft.chain(
						function(next) {
							this.validateDailyActivePublishersCount(function(response) {
								if (this.validateResponse(response)) {
									next();
								}
							}, this);
						},
						function(next) {
							callback.call(scope, response);
							next();
						},
						this
					);
				}, this]);
			},

			/**
			 * Получает максимальное число активных ежедневных изданий.
			 * @param {(maxCount: number) => void} callback
			 */
			getMaxDailyActivePublicationsCount: function(callback) {
				BPMSoft.SysSettings.querySysSettingsItem(
					"MaxDailyActivePublicationsCount",
					callback,
					this
				);
			},

			/**
			 * Получает количество активных ежедневных публикаций.
			 * @param {(publishersCount: number) => void} callback 
			 */
			getDailyActivePublicationsCount: function(callback) {
				const esq = Ext.create("BPMSoft.EntitySchemaQuery", {
					rootSchemaName: "NrbPeriodicalPublications"
				});

				const countColumn = "DailyActivePublicationsCount";

				esq.addAggregationSchemaColumn(
					"Id",
					BPMSoft.AggregationType.COUNT,
					countColumn, 
				);

				esq.filters.addItem(
					esq.createColumnFilterWithParameter(
						BPMSoft.ComparisonType.EQUAL,
						"NrbPeriodicity",
						NrbConst.EverydayPeriodicity
					)
				);

				esq.filters.addItem(
					esq.createColumnFilterWithParameter(
						BPMSoft.ComparisonType.EQUAL,
						"NrbIsActive",
						NrbConst.ActivePublication
					)
				);

				esq.getEntityCollection(function(response) {
					if (!response.success || response.collection.isEmpty()) {
						throw new Error(this.get("Resources.Strings.SqlErrorMessage"));	
					}

					const count = response.collection.getByIndex(0).get(countColumn);

					Ext.callback(callback, this, [count]);
				}, this);

			},

			/**
			 * Валидация количества активных ежедневных изданий.
			 * @param {*} callback Функция обратного вызова.
			 * @param {*} scope Контекст выполнения.
			 */
			validateDailyActivePublishersCount: function(callback, scope) {
				const isDaily = 
				this.get("NrbPeriodicity").value === NrbConst.EverydayPeriodicity.toLowerCase();
				
				const result = {
					success: true,
					message: undefined
				};

				if(!isDaily) {
					Ext.callback(callback, scope || this, [result]);

					return;
				}

				this.getDailyActivePublicationsCount(function(count) {
					this.getMaxDailyActivePublicationsCount(function(maxCount) {
						if (count >= maxCount) {
							result.message = Ext.String.format(
								this.get("Resources.Strings.NrbTooManyActiveDailyPrograms"),
								 maxCount
							);
							result.success = false;
						}

						Ext.callback(callback, scope || this, [result]);
					})
				});
			},

			getResponsiblePersonFilter: function() {
				const filterGroup = Ext.create("BPMSoft.FilterGroup");

				filterGroup.addItem(BPMSoft.createColumnFilterWithParameter(
					BPMSoft.ComparisonType.EQUAL,
					"Gender",
					NrbConst.MaleGender
				));

				filterGroup.addItem(BPMSoft.createColumnFilterWithParameter(
					BPMSoft.ComparisonType.GREATER_OR_EQUAL,
					"Age",
					NrbConst.MinAge
				));

				return filterGroup;
			}
		},
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"name": "NrbName",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "NrbName"
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NrbCode",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "NrbCode",
					"enabled": true
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NrbComment",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 3,
						"column": 12,
						"row": 0,
						"layoutName": "Header"
					},
					"bindTo": "NrbComment",
					"enabled": true,
					"contentType": 0
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "NrbResponsiblePerson",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 1,
						"layoutName": "Header"
					},
					"bindTo": "NrbResponsiblePerson",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "NrbPeriodicity",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 2,
						"layoutName": "Header"
					},
					"bindTo": "NrbPeriodicity",
					"enabled": true,
					"contentType": 5
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "NrbLastPublicationDate",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 3,
						"layoutName": "Header"
					},
					"bindTo": "NrbLastPublicationDate",
					"enabled": true
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "NrbIsActive",
				"values": {
					"layout": {
						"colSpan": 11,
						"rowSpan": 1,
						"column": 0,
						"row": 4,
						"layoutName": "Header"
					},
					"bindTo": "NrbIsActive",
					"enabled": true
				},
				"parentName": "Header",
				"propertyName": "items",
				"index": 5
			},
			{
				"operation": "insert",
				"name": "TabCommonInfo",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.TabCommonInfoTabCaption"
					},
					"items": [],
					"order": 0
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NrbReleaseDetail",
				"values": {
					"itemType": 2,
					"markerValue": "added-detail"
				},
				"parentName": "TabCommonInfo",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesAndFilesTab",
				"values": {
					"caption": {
						"bindTo": "Resources.Strings.NotesAndFilesTabCaption"
					},
					"items": [],
					"order": 1
				},
				"parentName": "Tabs",
				"propertyName": "tabs",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Files",
				"values": {
					"itemType": 2
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "NotesControlGroup",
				"values": {
					"itemType": 15,
					"caption": {
						"bindTo": "Resources.Strings.NotesGroupCaption"
					},
					"items": []
				},
				"parentName": "NotesAndFilesTab",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "Notes",
				"values": {
					"bindTo": "NrbNotes",
					"dataValueType": 1,
					"contentType": 4,
					"layout": {
						"column": 0,
						"row": 0,
						"colSpan": 24
					},
					"labelConfig": {
						"visible": false
					},
					"controlConfig": {
						"imageLoaded": {
							"bindTo": "insertImagesToNotes"
						},
						"images": {
							"bindTo": "NotesImagesCollection"
						}
					}
				},
				"parentName": "NotesControlGroup",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "merge",
				"name": "ESNTab",
				"values": {
					"order": 2
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
